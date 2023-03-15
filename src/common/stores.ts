import { Ref } from "vue";
import { ConfigData, WidgetData } from "./types";
import { defineStore } from "pinia";
import { isFailed, TBAData } from "./tba";
import { useStorage } from "@vueuse/core";

interface WidgetValue {
  readonly name: string;
  readonly value: Ref;
}

interface PointValue {
  readonly name: string;
  readonly value: Ref;
  readonly pointval: number;
  readonly pointlist: number[];
}

interface AggregateValue {
  readonly name: string;
  readonly type: string;
  readonly value: Ref;
}

interface TeamAggregate {
  team: string,
  aggregates: string[]
}


export interface SavedData {
  header: string[]; // Each element is a value in the CSV header
  values: string[][]; // Each element is a CSV record, each element in a record is a widget value
  aggregateHeaders: string[]; // Each element is a value in the csv header for the aggregate/analysis page
  aggregateValues: TeamAggregate[] ; // Each element is a csv record, each element is a aggregate for each team. There will be a row for each team.
}

// Store to contain configuration data for the scouting form
export const useConfigStore = defineStore("config", () => {
  const name = $ref("");
  const data = $ref({} as ConfigData);

  return $$({ name, data });
});

// Store to contain widget information and saved records
export const useWidgetsStore = defineStore("widgets", () => {
  // Temporary array for widgets in the current loaded form (stored in RAM)
  let values = $ref(new Array<WidgetValue>());
  let points = $ref(new Array<PointValue>());
  let aggregates = $ref(new Array<AggregateValue>());

  // All saved data (config names in the map correspond to form data for that config, stored on disk)
  const savedData = $ref(useStorage("widgetsSavedData", new Map<string, SavedData>()));

  const lastWidgetRowEnd = $ref(1);
  const config = useConfigStore();

  // Download link for the current configuration
  const downloadLink = $computed(() => {
    const data = savedData.get(config.name);
    return (data === undefined) ? null : makeDownloadLink(data);
  });

  // Creates a download link for a given data object.
  function makeDownloadLink(data: SavedData): string {
    // Transforms an array of strings into valid CSV by escaping quotes, then joining each value.
    // https://en.wikipedia.org/wiki/Comma-separated_values
    const escape = (s: string[]) => s.map(i => `"${i.replaceAll('"', '""')}"`).join();

    // Escape the header and list of records, then put them together into a blob for downloading
    const header = escape(data.header);
    const records = data.values.map(escape);
    return URL.createObjectURL(new Blob([[header, ...records].join("\n")], { type: "text/csv" }));
  }

  function makeAggregateDownloadLink(data: SavedData): string {
    // Transforms an array of strings into valid CSV by escaping quotes, then joining each value.
    // https://en.wikipedia.org/wiki/Comma-separated_values
    const escape = (s: string[]) => s.map(i => `"${i.replaceAll('"', '""')}"`).join();

    // Escape the header and list of records, then put them together into a blob for downloading
    const header = escape(data.aggregateHeaders);
    const records = data.aggregateValues.map(a => a.aggregates).map(escape);
    return URL.createObjectURL(new Blob([[header, ...records].join("\n")], { type: "text/csv" }));
  }

  // Adds a widget and its reactive value to a temporary array.
  function addWidgetValue(key: string | WidgetData, value: Ref) {
    let name = null;

    if (typeof key === "string") {
      // String key provided, use it as the name
      name = key;
    } else if (key.name !== undefined) {
      // Data object key provided, use its name field if it's defined
      name = (key.prefix ? `${key.prefix}-${key.name}` : key.name).replaceAll(/\s/g, "");
    } else {
      // Invalid argument
      return -1;
    }

    return values.push({ name, value }) - 1;
  }

  function addPoints(key: string | WidgetData, value: Ref, pointval: number, pointlist: number[]){
    let name = null;

    //console.log(key, value, pointval);
    if (typeof key === "string") {
      // String key provided, use it as the name
      name = key;
    } else if (key.name !== undefined) {
      // Data object key provided, use its name field if it's defined
      name = (key.prefix ? `${key.prefix}-${key.name}` : key.name).replaceAll(/\s/g, "");
    } else {
      // Invalid argument
      return -1;
    }

    return points.push({ name, value, pointval, pointlist }) - 1;
  }

  function addAggregate(key: string | WidgetData, type: string, value: Ref) {
    let name = null;

    if (typeof key === "string") {
      // String key provided, use it as the name
      name = key;
    } else if (key.name !== undefined) {
      // Data object key provided, use its name field if it's defined
      name = (key.prefix ? `${key.prefix}-${key.name}` : key.name).replaceAll(/\s/g, "");
    } else {
      // Invalid argument
      return -1;
    }

    return aggregates.push({ name, type, value}) - 1;
  }

  // Saves the temporary array of widget data to a record in local storage.
  function save() {
    // Turns a value into a string. Arrays are space-delimited to minimize collision with the CSV format.
    const stringify = (value: unknown) => Array.isArray(value) ? value.join(" ") : String(value);

    // Get header and record from the data (`name` is already a string so it does not need stringification)
    let header = values.map(i => i.name);
    let record = values.map(i => stringify(i.value));

    console.log('headers', header)
    
    //Add Points contributed using the points value of certain widgets
    if(points.length > 0){
      header = header.concat("PointsContributed");
      let pointTotal = points.reduce(function(a,b){
        
        //if it has a pointlist it must be a dropdown or radio btn, so pull the corresponding point value
        if(b.pointlist.length > 0){
          return a + b.pointlist[b.value];
        }
        else{
          return a + b.value * b.pointval;
        } 
      }, 0);

      record = record.concat(pointTotal.toString());
    }
    // Then add the current timestamp as the last field in the record
    header = header.concat("ScoutedTime");
    record = record.concat(new Date().toLocaleString());

    let entry = savedData.get(config.name); //moved this line here in order to reference it during aggregate calc

    //AGGREGATES SECTION
    
    // find the position in array of the team number and use the team number as first col in aggregate table
    const teampos = header.findIndex(h => h == "TeamNumber");
    const teamnum = teampos ? record[teampos] : 0;
    let aggregateHeader = ["Team"].concat(aggregates.map(i => i.name + "_" + i.type));
    
    //get aggregate data for this submission and then add match and points
    aggregateHeader.push("PointsContributed_Average");
    aggregateHeader.push("Matches");
    let teamAgg: TeamAggregate = {team: stringify(teamnum), aggregates: [stringify(teamnum)].concat(aggregates.map(i => stringify(i.value))).concat(record[record.length-2]).concat("1")} 
    let newTeamAgg = teamAgg; //this will be used during the calculations for a team that already has data.
    //check if team already has a record in aggregates, if so use it.


    let existingteam = -1;
    if(entry != undefined){
      
      existingteam = entry?.aggregateValues.findIndex(a => a.team == stringify(teamnum));
    } 

    if (existingteam != -1){
      let existingdata = entry?.aggregateValues[existingteam];

      //update match count and use it in calculations for averages. 
      let matchcount = Number(existingdata.aggregates[existingdata.aggregates.length-1]) + 1;
      newTeamAgg.aggregates[newTeamAgg.aggregates.length-1] = matchcount.toString();

      //update point average
      let newpoints = Number(teamAgg.aggregates[teamAgg.aggregates.length-2]);
      let oldpoints = Number(existingdata?.aggregates[existingdata.aggregates.length - 2]);
      let newAveragePoints = (oldpoints * (matchcount - 1) + newpoints) / matchcount;
      newTeamAgg.aggregates[newTeamAgg.aggregates.length - 2] = newAveragePoints.toString();

      //update each aggregate

      aggregates.forEach((a, i) => {
        switch(a.type){
          case "sum": 
            newTeamAgg.aggregates[i+1] = String(Number(existingdata.aggregates[i+1]) + a.value);
            break;
          case "min":
            if(a.value < existingdata.aggregates[i +1]){
              newTeamAgg.aggregates[i+1] = a.value.toString();
            }
            break;
          case "max":
            if(a.value > existingdata.aggregates[i +1]){
              newTeamAgg.aggregates[i+1] = a.value.toString();
            }
            break;
          case "average":
            newTeamAgg.aggregates[i+1] = String((((Number(existingdata.aggregates[i+1]) * (matchcount - 1)) + a.value) / matchcount).toFixed(2));
            break;
          // case "averageifoverzero":
          //   newTeamAgg.aggregates[i+1] = String(((Number(existingdata.aggregates[i+1]) * (matchcount - 1)) + a.value) / matchcount);
          //   break;
        }

      });
      
    }


    // Add to saved local storage
    
    if (entry === undefined) {
      // The entry for the current configuration name does not exist, create it
      savedData.set(config.name, { header, values: [record], aggregateHeaders: aggregateHeader, aggregateValues: [teamAgg] });
    } else {
      // The entry exists, overwrite the header and append the record
      entry.header = header;
      entry.values.push(record);
      entry.aggregateHeaders = aggregateHeader;
      if (existingteam != -1){
        entry.aggregateValues[existingteam] = newTeamAgg;
      }else {
        entry.aggregateValues.push(teamAgg);
      }
      
    }

    values = [];
    points = [];
    aggregates = [];
  }

  function clearCurrRecord() {
    values = new Array<WidgetValue>();
    points = new Array<PointValue>();
    aggregates = new Array<AggregateValue>();
  }

  return $$({ values, savedData, lastWidgetRowEnd, downloadLink, makeDownloadLink, addWidgetValue, save, addPoints, addAggregate, makeAggregateDownloadLink, clearCurrRecord });
});

// Store to contain widget validation status flags
export const useValidationStore = defineStore("validation", () => {
  const triggerPages = $ref(new Array<number>()); // Array of pages to validate
  const failedPage = $ref(-1); // Index of page that failed validation (-1 indicates success)

  return $$({ triggerPages, failedPage });
});

// Store to contain data fetched from The Blue Alliance
export const useTBAStore = defineStore("tba", () => {
  let eventCode = $ref(useStorage("tbaEventCode", ""));
  const savedData = $ref(useStorage("tbaSavedData", new Map<string, object>()));

  // Loads TBA data using cache if specified.
  async function load(code: string, name: string): Promise<TBAData> {
    // If an empty code is given, use the cached data in local storage (if it exists)
    if (code === "") {
      const localData = savedData.get(name);
      const promise = await Promise.resolve(localData ?? {});
      
      return { code: eventCode, data: promise };
    }

    let apiurl = name == 'rankings' ? 
      `https://www.thebluealliance.com/api/v3/event/${code}/${name}` :
      `https://www.thebluealliance.com/api/v3/event/${code}/${name}/simple`;

    // Otherwise, fetch the data from the API, passing the API key (must be set in env)
    const fetchData = await fetch(apiurl, {
      headers: { "X-TBA-Auth-Key": import.meta.env.VITE_TBA_API_KEY }
    });

    // Parse the data as a JSON object
    const data = await fetchData.json();

    // If the fetch succeeded, cache the results
    if (!isFailed(data)) {
      savedData.set(name, data);
      eventCode = code;
    }

    return { code, data };
  }

  return $$({ eventCode, savedData, load });
});
