<template>
  <ProductEdit v-if="entry" :id="id" :entry="entry" :notify="notify" :categories="categories" />
  <NotFound v-if="!entry" />
</template>

<script lang="ts">
import { defineComponent, PropType, reactive, ref } from 'vue'
import { useToast } from "primevue/usetoast";
import ProductEdit from '../components/ProductEdit.vue';
import NotFound from './NotFound.vue';
import product, { Entry, Category } from "../modules/product";

export default defineComponent({
  props: {
    id: {
      type: String as PropType<string>,
      required: true,
    }
  },
  async setup(props) {
    const toast = useToast();
    const id = parseInt(props.id);
    const fetched = `${id}` === props.id ? await product.getById(id) : null;
    const entry = fetched ? reactive<Entry>(fetched) : null;
    const categories = ref<Category[]>(await product.categories());

    const notify = (args: {
      severity: string,
      summary: string,
      detail: string,
    }): void => {
      toast.add({...args, life: 3000});
    }

    return { id, entry, notify, categories };
  },
  components: {
    ProductEdit,
    NotFound,
  },
});
</script>

<style lang="scss" scoped>
</style>
