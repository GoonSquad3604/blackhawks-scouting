<template>
    <div id="controls-container">
      <RouterLink :to="{ name: 'home' }" style="margin-right: 40px;">Home</RouterLink>
      <RouterLink :to="{ name: 'inspector' }" style="margin-right: 40px;">Data Inspector</RouterLink>
      <span v-if="widgets.savedData.size === 0">&lt;No Entries&gt;</span>
      <template v-else>
        <select id="entry-select" v-model.number="selectedIdx">
        <option v-for="[i, name] of entries.entries()" :key="i" :value="i">{{ name }}</option>
      </select>
      </template>
    </div>
    <div class="table-container">
      <span v-if="selectedEntry === undefined">No Data</span>
      <AnalysisTable v-else :data="selectedEntry" />
  </div>

  </template>
  
  <script setup lang="ts">
    import { useConfigStore, useWidgetsStore, useValidationStore } from "@/common/stores";
  import AnalysisTable from "./AnalysisTable.vue";

    //CURRENTLY ONLY DOES AGGREGATE OF FIRST
    let selectedIdx = $ref(0); // The index of the entry selected in the combobox
    const config = useConfigStore();
    const widgets = useWidgetsStore();
    const validation = useValidationStore();

    const entries = $computed(() => [...widgets.savedData.keys()]); // The entries in local storage
    let selectedEntry = $computed(() => widgets.savedData.get(entries[selectedIdx])); // The selected entry

    
    let sortables = ['rank', 'avgScoreContribution'];

    getSortables();

    function getSortables(){
        console.log(config);
        console.log(widgets.savedData);
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
  