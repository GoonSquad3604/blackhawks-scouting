<template>
  <select :id="currentId" v-model="value">
    <option v-if="data.defaultOption" :value="-1" selected disabled>Select...</option>
    <option v-for="[i, value] of data.options?.entries()" :value="i" :key="i">{{ value }}</option>
  </select>
</template>

<script setup lang="ts">
import { useWidgetsStore } from "@/common/stores";
import { WidgetData } from "@/common/types";

const props = defineProps<{
  data: WidgetData,
  currentId: string
}>();

const value = $ref(props.data.defaultOption ? -1 : 0);
defineExpose({ index: useWidgetsStore().addWidgetValue(props.data, $$(value)) });
if(props.data.pointsForOptions){
  useWidgetsStore().addPoints(props.data, $$(value), 0, props.data.pointsForOptions);
}

if(props.data.aggregates && props.data.aggregates.length > 0){
  props.data.aggregates.forEach(a => {
    useWidgetsStore().addAggregate(props.data, a.aggregate, $$(value));
  });
}
</script>
