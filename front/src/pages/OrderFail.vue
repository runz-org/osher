<template>
<h1 class="p-d-flex p-jc-center">Платёж не принят</h1>

<router-link :to="`/events/`" class="p-d-flex p-jc-center">
  <button class="p-link">Перейти к списку мероприятий</button>
</router-link>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  async setup() {
  },
})
</script>

<style lang="scss" scoped>
h1 {
  font-size: 5rem;
  color: #fab7be;
}
</style>
