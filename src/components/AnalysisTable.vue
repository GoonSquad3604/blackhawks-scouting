<template>
    <table class="inspector-table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Name</th>
          <th v-for="[i, value] of data.aggregateHeaders.entries()" :key="i">{{ value}}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="[i, record] of data.aggregateValues.entries()" :key="i" >
          <td>{{getTeamRanking(record.team)}}</td>
          <td>{{getTeamName(record.team)}}</td>
          <td v-for="[j, value] of record.aggregates.entries()" :key="j">{{ value }}</td>
        </tr>
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

    return teamRank ? teamRank.rank : "NAN";
  }

  function getTeamName(team: string){
    let teamName = teams.find(r => r.key == "frc"+team);

    return teamName ? teamName.nickname: "NAN";
  }
  
  
  </script>
  
  <style lang="postcss">
  .inspector-table {
    
  
    tr {
      
      cursor: pointer;
      transition: background-color 0.1s;
      
    }

    tr:hover {
      
        background-color: #464646;
      
    }
  
    .select {
      background-color: #464646;
    }

    th {
      max-width: 100px; 
      word-wrap: break-word !important;
      white-space: normal;
    }
    td {
      max-width: 100px; 
      word-wrap: break-word !important;
      white-space: normal;
    }
  }
  </style>
  