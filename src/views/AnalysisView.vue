<template>
    <div id="analysis-container">
      <AnalysisContainer />
    </div>
  </template>
  
  <script setup lang="ts">
  import AnalysisContainer from "@/components/AnalysisContainer.vue";
  </script>
  
  <style>
  #analysis-container {
    display: grid;
    height: 100vh;
    gap: 20px;
    grid-template-rows: auto 1fr;
  }
  </style>