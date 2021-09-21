<template>
<div class="p-grid p-fluid dashboard">
  <div class="p-col-12 p-lg-4">
    <Button label="Мероприятия" icon="pi pi-list" class="p-button-raised p-mr-2 p-mb-2" @click="$router.push('/products')"/>
  </div>
  <div class="p-col-12 p-lg-4">
    <Button label="Платежи" icon="pi pi-credit-card" class="p-button-raised p-mr-2 p-mb-2" @click="$router.push('/transactions')"/>
  </div>
  <div class="p-col-12 p-lg-4">
  </div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Button from 'primevue/button';

export default defineComponent({
  async setup() {
    return {
    }
  },
  components: {
    Button,
  },
});
</script>
