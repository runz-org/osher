<template>
<div class="code p-d-flex p-jc-center">404</div>
<div class="text p-d-flex p-jc-center">Станица не найдена {{ $route.path }}</div>
</template>

<script lang="ts">
import { defineComponent, useSSRContext } from "vue";

export default defineComponent({
  setup() {
    const context = (import.meta as any).env.SSR ? useSSRContext() : undefined;
    const { setStatus = () => {} } = context || {};
    setStatus(404);

    return {
    }
  },
})
</script>

<style lang="scss" scoped>
.code {
  font-size: 12rem;
  color: #CCC;
}
</style>
