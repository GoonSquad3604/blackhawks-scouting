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
      <button v-if="selectedEntry && hasSelectedRecords && selectedRecords.size == 1" @click="generateQRCode">Generate QR Code</button>
      <span v-else>Select Only 1 record to Generate a QR Code</span>
    </template>
    <br/>
    <label for="team-select">Teams</label>
      <select id="team-select" v-model.number="selectedteam" @change="filterTeams()">
        <option v-for="team in teams" :key="team.team_number" :value="team.team_number">{{ team.nickname }}</option>
      </select>
      <button @click="clearTeamFilter">Clear Filter</button>
  </div>
  <!-- <div class="table-container" >
    <qrcode-vue :value="qrValue" :size="120" level="H" />
    <qrcode-stream @decode="decodeQR"></qrcode-stream>
  </div> -->
  <div class="table-container">
    <span v-if="selectedEntry === undefined">No Data</span>
    <InspectorTable v-else v-model="selectedRecords" :data="selectedEntry" />
  </div>
  <a :hidden="true" :download="entries[selectedIdx]" ref="downloadLink"></a>
  <!-- <qrcode-vue :value="value" :size="size" level="H" /> -->
</template>

<script setup lang="ts">
import InspectorTable from "./InspectorTable.vue";
import { useWidgetsStore, useTBAStore } from "@/common/stores.js";
import QrcodeVue from 'qrcode.vue';
import { QrcodeStream, QrcodeDropZone, QrcodeCapture } from 'vue-qrcode-reader'
import { isTemplateElement, jSXAttribute } from "@babel/types";


const widgets = useWidgetsStore();
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
    let filteredList = selectedEntry.values.filter(v => v.filter( s => s == selectedteam.toString()).length > 0)
    selectedEntry.values = filteredList;
    return;
  }
  else if(selectedteam == 0){
    clearTeamFilter()
  }
  
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
