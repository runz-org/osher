<template>
<Event v-if="id && entry" :id="id" :entry="entry" />
<NotFound v-else />
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import product from "../modules/product";
import Event from "../components/Event.vue";
import NotFound from "./NotFound.vue";

export default defineComponent({
  props: {
    slug: {
      type: String as PropType<string>,
      required: true,
    }
  },
  async setup({ slug }) {
    //await new Promise((resolve, reject) => setTimeout(resolve, 5000));
    return product.getBySlug(slug);
  },
  components: {
    Event,
    NotFound,
  },
})
</script>

<style lang="scss" scoped>
</style>
