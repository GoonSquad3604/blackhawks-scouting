<template>
    <table class="inspector-table">
      <thead>
        <tr>
          <th>Rank</th>
          <th v-for="[i, value] of data.aggregateHeaders.entries()" :key="i">{{ value }}</th>
        </tr>
      </thead>
      <tbody>
        <label v-for="[i, record] of data.aggregateValues.entries()" :key="i" >
          <td>{{getTeamRanking(record.team)}}</td>
          <td v-for="[j, value] of record.aggregates.entries()" :key="j">{{ value }}</td>
        </label>
      </tbody>
    </table>
  </template>
  
  <script setup lang="ts">
  import { range } from "lodash";
  import { SavedData, useTBAStore } from "@/common/stores";
  import { watchEffect } from "vue";
  
  const props = defineProps<{
    data: SavedData
  }>();

  const tba = useTBAStore();
  let teams: any[] = tba.savedData.get("teams");
  let rankings: any[] = tba.savedData.get("rankings");

  function getTeamRanking(team: string){
    let teamRank = rankings.rankings.find(r => r.team_key == "frc"+team);

    return teamRank.rank;
  }

  function getTeamName(team: string){
    console.log(team);
    return team;
  }
  
  
  </script>
  
  <style lang="postcss">
  .inspector-table {
    white-space: pre;
  
    label {
      display: table-row;
      cursor: pointer;
      transition: background-color 0.1s;
    }
  
    .select {
      background-color: #464646;
    }
  }
  </style>
  