<template>
<p>
  <b>Добро пожаловать в женский клуб OSher!</b>
</p>
<p>
  Совсем скоро мы откроемся для всех желающих!
  Ожидайте информацию о продаже клубных карт, которая будет размещена на этой странице.
</p>
<p>
  На текущий момент вы можете участвовать в ближайших событиях, приобретя билет.
</p>

<router-link :to="`/events/`">
  <RedButton class="p-mt-6">Ближайшие мероприятия</RedButton>
</router-link>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import RedButton from "../components/RedButton.vue";

export default defineComponent({
  async setup() {
    return {
    }
  },
  components: {
    RedButton,
  },
})
</script>

<style lang="scss" scoped>
</style>
