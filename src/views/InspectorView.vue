<template>
  <div id="inspector-container">
    <Suspense>
      <InspectorContainer />
    </Suspense>
  </div>
</template>

<script setup lang="ts">
import InspectorContainer from "@/components/InspectorContainer.vue";
</script>

<style>
#inspector-container {
  display: grid;
  height: 100vh;
  gap: 20px;
  grid-template-rows: auto 1fr;
}
</style>
