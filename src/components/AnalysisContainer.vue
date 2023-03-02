<template>
    <div id="controls-container">
      <RouterLink :to="{ name: 'home' }" style="margin-right: 40px;">Home</RouterLink>
      <RouterLink :to="{ name: 'inspector' }" style="margin-right: 40px;">Data Inspector</RouterLink>
      <span v-if="widgets.savedData.size === 0">&lt;No Entries&gt;</span>
      <template v-else>
    
      </template>
    </div>
   

  </template>
  
  <script setup lang="ts">
    import { useConfigStore, useWidgetsStore, useValidationStore } from "@/common/stores";

    const config = useConfigStore();
    const widgets = useWidgetsStore();
    const validation = useValidationStore();

    
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
  