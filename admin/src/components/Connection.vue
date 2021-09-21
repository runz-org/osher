<template>
<div class="indicator">
  <svg v-if="state.session_id" :key="`connected:${state.heartbeat}`" width="16" height="16" viewbox="0 0 16 16">
    <circle cx="10" cy="6" fill="none" r="8" stroke="#C5E1A5" stroke-width="1">
      <animate attributeName="r" from="3" to="8" dur="0.5s" begin="0s" repeatCount="1" fill="freeze"/>
      <animate attributeName="opacity" from="1" to="0" dur="0.5s" begin="0s" repeatCount="1" fill="freeze"/>
    </circle>
    <circle cx="10" cy="6" fill="#C5E1A5" r="3">
      <animate attributeName="r" from="0" to="3" dur="0.5s" begin="0s" repeatCount="1" fill="freeze"/>
    </circle>
  </svg>
  <svg v-else key="disconnected" width="16" height="16" viewbox="0 0 16 16">
    <circle cx="10" cy="6" fill="#F48FB1" r="3"/>
  </svg>
</div>
</template>

<script lang="ts">
import { defineComponent, watch, onMounted, onUnmounted } from "vue";
import connection from '../modules/connection'

export default defineComponent({
  name: 'Connection',
  setup() {
    onMounted(() => connection.open())
    onUnmounted(() => connection.close())

    if ((import.meta as any).env.DEV) {
      watch(() => connection.state.session_id, (session_id, old_session_id) => {
        if (session_id) {
          console.log(`Connected: ${session_id}`)
        } else {
          console.log(`Disconnected: ${old_session_id}`)
        }
      })
    }

    return {
      state: connection.state,
    }
  },
})
</script>

<style lang="scss" scoped>
.indicator {
  position: absolute;
  right: 0;
  top: 0;
  background-color: #fff;
  border-radius: 0 0 0 80%;
  width: 16px;
  height: 16px;
}
</style>
