<template>
  <div id="controls-container">
    <RouterLink :to="{ name: 'home' }" style="margin-right: 20px;">Home</RouterLink>
    <RouterLink :to="{ name: 'analysis' }" style="margin-right: 20px;">Data Analysis</RouterLink>
    <span v-if="widgets.savedData.size === 0">&lt;No Entries&gt;</span>
    <template v-else>
      <label for="entry-select">Entry</label>
      <select id="entry-select" v-model.number="selectedIdx">
        <option v-for="[i, name] of entries.entries()" :key="i" :value="i">{{ name }}</option>
      </select>
      <button @click="deleteData">Delete</button>
      <button @click="downloadData">Download</button>
      <button @click="clearData">Clear All</button>
      
      <!-- <button v-if="selectedEntry && hasSelectedRecords && selectedRecords.size == 1" @click="generateQRCode">Generate QR Code</button>
      <span v-else>Select Only 1 record to Generate a QR Code</span> -->
    </template>
    <!-- <StreamBarcodeReader
    @decode="onDecode"
    @loaded="onLoaded"
></StreamBarcodeReader> -->
    <label for="fileupload">Upload Data</label>
    <input id="fileupload" type="file" accept=".csv" @change="uploadFile" ref="file">
    <br/>
    <!-- <label for="team-select">Teams</label>
      <select id="team-select" v-model.number="selectedteam" @change="filterTeams()">
        <option v-for="team in teams" :key="team.team_number" :value="team.team_number">{{ team.nickname }}</option>
      </select>
      <button @click="clearTeamFilter">Clear Filter</button> -->
  </div>
  <!-- <div class="table-container" >
    <qrcode-vue :value="qrValue" :size="120" level="H" />
    <qrcode-stream @decode="decodeQR"></qrcode-stream>
  </div> -->
  <div class="table-container">
    <span v-if="selectedEntry === undefined">No Data</span>
    <InspectorTable v-else v-model="selectedRecords" :data="filteredList" />
  </div>
  <a :hidden="true" :download="entries[selectedIdx]" ref="downloadLink"></a>
  <!-- <qrcode-vue :value="value" :size="size" level="H" /> -->
</template>

<script setup lang="ts">
import InspectorTable from "./InspectorTable.vue";

import { useWidgetsStore, useTBAStore, useConfigStore, SavedData } from "@/common/stores.js";
import assert from 'assert';
import { parse } from 'csv-parse';
import { isTemplateElement, jSXAttribute } from "@babel/types";
import { watch } from 'vue';
import { StreamBarcodeReader } from "vue-barcode-reader";


const config = useConfigStore();
const widgets = useWidgetsStore();

//Hard code name for now. FIX LATER
config.name = "matches";

// // Fetch the configuration file
const fetchResult = await fetch(`${import.meta.env.BASE_URL}assets/config-${config.name}.json`);

if (!fetchResult.ok)
  throw new Error(`JSON configuration fetch failed: HTTP ${fetchResult.status} (${fetchResult.statusText})`);

 config.data = await fetchResult.json();

//build config array
let widgetList = [];

config.data.pages.forEach(p =>{
  widgetList = widgetList.concat(p.widgets);
  console.log(p)
});


//console.log(widgetList);

let selectedIdx = $ref(0); // The index of the entry selected in the combobox
let selectedteam = $ref(0);

const tba = useTBAStore();

let qrGenerated = false;
let qrValue = "";

const downloadLink = $ref<HTMLAnchorElement>();
const selectedRecords = $ref(new Set<number>());
const hasSelectedRecords = $computed(() => selectedRecords.size > 0);

const entries = $computed(() => [...widgets.savedData.keys()]); // The entries in local storage
let selectedEntry = $computed(() => widgets.savedData.get(entries[selectedIdx])); // The selected entry

let teams: any[] = tba.savedData.get("teams");
let filteredList :SavedData = {aggregateHeaders : selectedEntry.aggregateHeaders, aggregateValues : selectedEntry.aggregateValues, values: selectedEntry.values, header: selectedEntry.header }

teams.sort((a, b) => {
  return a.team_number - b.team_number;
})

// Filters records in the selected entry based on the user selection.
// If there are no records selected, the filter directly uses the given state, returning either all or no records.
const filterRecords = (state: boolean) => (selectedEntry === undefined)
  ? []
  : selectedEntry.values.filter((_v, i) => hasSelectedRecords ? (selectedRecords.has(i) === state) : state);

function deleteData() {
  if (selectedEntry === undefined) return;

  if (!confirm(`Delete ${hasSelectedRecords ? "the selected" : "all"} records in this entry permanently?`)) return;

  // Discard out the selected records
  // If there are none selected, they are all deleted
  selectedEntry.values = filterRecords(false);

  selectedRecords.clear();
}

function downloadData() {
  if (selectedEntry == undefined) return;

  // Generate the download link for the selected records, then trigger the download
  // If there are no records selected, they will all be included in the generated file
  downloadLink.href = widgets.makeDownloadLink({ header: selectedEntry.header, values: filterRecords(true) });
  downloadLink.click();
}

function clearData() {
  if (!confirm("Clear all saved entries in local storage permanently?")) return;

  widgets.savedData.clear();
  selectedIdx = 0; // Reset selected index
}

function clearTeamFilter() {
  selectedteam = 0;
  selectedEntry = widgets.savedData.get(entries[selectedIdx])

  return;
}

function filterTeams() {
  
  if(selectedteam > 0 && selectedEntry){
    filteredList.values = selectedEntry.values.filter(v => v.filter( s => s == selectedteam.toString()).length > 0)
    //selectedEntry.values = filteredList;
    return;
  }
  else if(selectedteam == 0){
    clearTeamFilter()
  }
  
}

function onDecode(text) {
    console.log(`Decode text from QR code is ${text}`)
}
function onLoaded() {
   console.log(`Ready to start scanning barcodes`)
}


function generateQRCode(): void {
  qrGenerated = true;
  let currRecord = filterRecords(true)[0];
  let code = [];
  for(var rec in currRecord){
    code.push("\"" + currRecord[rec] + "\"");
  }
  qrValue = code.join();
  console.log(qrGenerated);
  
  
}

async function uploadFile(event: any) {
  console.log("config",config.data.pages );
  if(event.target && event.target.files){
    let datafile = event.target.files[0];
    if (!confirm(`Upload ${datafile.name}? This will add its data to yours.`)) {
      return;
    }
    //widgets.savedData.clear();
    selectedIdx = 0; // Reset selected index

    let reader = new FileReader();

    reader.readAsText(datafile);
    reader.onload = function() {
      //console.log(reader.result);
      const lines = reader.result.split('\n')
      const result = [];
      const headersparsed = lines[0].split('","');
      let headers = [];

      headersparsed.forEach(h => {
        if(h.substring(0,1) == '"'){
          headers.push(h.substring(1, h.length))
        }
        else if(h.substring(h.length-1,h.length) == '"'){
          headers.push(h.substring(0, h.length-1))
        }
        else {
          headers.push(h)
        }
      });


      for (let i = 1; i < lines.length; i++) {        
          if (!lines[i])
              continue
          const obj = {}
          const currentlineparsed = lines[i].split('","');
          let currentline = [];

          currentlineparsed.forEach(h => {
            if(h.substring(0,1) == '"'){
              currentline.push(h.substring(1, h.length))
            }
            else if(h.substring(h.length-1,h.length) == '"'){
              currentline.push(h.substring(0, h.length-1))
            }
            else {
              currentline.push(h)
            }
          });

          for (let j = 0; j < headers.length; j++) {
              obj[headers[j]] = currentline[j]
          }
          result.push(obj)
      }

      //load csv data as completed form widgets. 

      result.forEach(async r =>{
        
        //console.log(r)
        widgets.addWidgetValue("EventKey", r["EventKey"]);
        widgets.addWidgetValue("MatchLevel", r["MatchLevel"]);
        widgets.addWidgetValue("MatchNumber", r["MatchNumber"]);
        widgets.addWidgetValue("Team", r["Team"]);
        widgets.addWidgetValue("TeamNumber", r["TeamNumber"]);

        widgetList.forEach(w =>{
          if(w.name){
            let name = w.name;
            if(w.prefix){
              name = w.prefix + "-" + w.name;
            }
            widgets.addWidgetValue(name, r[name.replaceAll(/\s/g, "")])

            if((w.type == "checkbox") && w.points){
              widgets.addPoints(w ,r[name.replaceAll(/\s/g, "")].toLowerCase() === 'true', w.points, []);
            }
            else if((w.type == "spinbox") && w.points){
              widgets.addPoints(w ,Number(r[name.replaceAll(/\s/g, "")]), w.points, []);
            }     
            else if(w.pointsForOptions){
              widgets.addPoints(w, Number(r[name.replaceAll(/\s/g, "")]), 0, w.pointsForOptions);
            }
            
            if(w.aggregates && w.aggregates.length > 0 && w.type == "checkbox"){
              w.aggregates.forEach(a => {
                widgets.addAggregate(w, a.aggregate, Number(r[name.replaceAll(/\s/g, "")].toLowerCase() === 'true'));
              });
            }
            else if(w.aggregates && w.aggregates.length > 0 && w.type == "spinbox"){ 
              w.aggregates.forEach(a => {
                widgets.addAggregate(w, a.aggregate, Number(r[name.replaceAll(/\s/g, "")]));
              });
            }
          }
        })

        await widgets.save();
        widgets.clearCurrRecord();
      });

      console.log(result);
    };
    
    
  }

  
}

async function decodeQR(input: PromiseLike<{ content: any; location: any; }> | { content: any; location: any; }) {
    try {
      const {
        content,      // decoded String
        location      // QR code coordinates
      } = await input

      // ...
    } catch (error) {
      // ...
    }
    console.log(input)
}
</script>

<style>
.table-container {
  overflow: auto;
}

#controls-container>* {
  margin: 4px;
}
</style>
