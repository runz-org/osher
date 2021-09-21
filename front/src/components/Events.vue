<template>
  <template v-for="(entry,i) of list" :key="entry.slug">
    <img v-if="entry.images.length > 0" :src="format.imageUrl(entry.images[0], 400, 400)" />
    <div class="start_time">
      {{ entry.start_time }}
    </div>
    <h2>
      {{ entry.title }}
    </h2>
    <router-link :to="`/events/${entry.slug}`">
      <RedButton>Подробнее</RedButton>
    </router-link>
    <div class="description" v-html="entry.description"></div>
    <div class="price">
      {{ format.currency(entry.price) }}
    </div>
    <Divider v-if="i < list.length - 1" class="p-my-6"/>
  </template>
</template>

<script lang="ts">
import {defineComponent, PropType} from "vue";
import format from '../modules/format';
import product, { Status } from "../modules/product";
import RedButton from "./RedButton.vue";
import Divider from "primevue/divider";

export default defineComponent({
  name: 'Events',
  props: {
    status: {
      type: Array as PropType<Status[]>,
      required: true,
    }
  },
  async setup({ status }) {
    //await new Promise((resolve, reject) => setTimeout(resolve, 5000));
    const data = await product.findAll();
    const list = data.
      filter(item => status.includes(item.entry.status)).
      map(item => ({
        ...item.entry,
        image: item.entry.images.length > 0 ? item.entry.images[0] : null,
      }));

    return {
      list,
      format,
    }
  },
  components: {
    RedButton,
    Divider,
  }
})
</script>

<style lang="scss" scoped>
.start_time {
  padding-top: 10px;
  color: #777;
  font-size: 1.2rem;
}
.price {
  padding-top: 10px;
  color: #777;
  font-size: 1.2rem;
}
hr {
  margin: 50px 0px;
  border: none;
  height: 2px;
  background-color: #DDD;
}
</style>
