<template>
<S width="30rem" height="2rem" class="p-mb-3" />
<S width="640px" height="337px" class="p-mb-5" />
<S width="5rem" height="1rem" class="p-mb-2" />
<S width="10rem" height="3rem" class="p-mb-5" />
<S width="30rem" height="1rem" class="p-mb-1" />
<S width="45rem" height="1rem" class="p-mb-1" />
<S width="40rem" height="1rem" class="p-mb-1" />
<S width="20rem" height="1rem" class="p-mb-1" />
<S width="35rem" height="1rem" class="p-mb-1" />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Skeleton from "primevue/skeleton";

export default defineComponent({
  name: 'Skeleton',
  setup() {
    return {
    }
  },
  components: {
    S: Skeleton,
  },
})
</script>

<style lang="scss" scoped>
</style>
