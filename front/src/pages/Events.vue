<template>
<h1 class="p-mb-6">Ближайшие мероприятия</h1>
<Events :status="[Status.upcomming]" />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Events from "../components/Events.vue";
import { Status } from "../modules/product";

export default defineComponent({
  async setup() {
    return {
      Status,
    }
  },
  components: {
    Events,
  }
})
</script>

<style lang="scss" scoped>
</style>