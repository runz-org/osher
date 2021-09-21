<template>
  <UserEdit v-if="entry" :id="id" :entry="entry" :notify="notify" />
  <NotFound v-if="!entry" />
</template>

<script lang="ts">
import { defineComponent, PropType, reactive } from 'vue'
import { useToast } from "primevue/usetoast";
import UserEdit from '../components/UserEdit.vue';
import NotFound from './NotFound.vue';
import user, { Entry } from "../modules/user";

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
    const fetched = `${id}` === props.id ? await user.getById(id) : null;
    const entry = fetched ? reactive<Entry>(fetched) : null;

    const notify = (args: {
      severity: string,
      summary: string,
      detail: string,
    }): void => {
      toast.add({...args, life: 3000});
    }

    return { id, entry, notify };
  },
  components: {
    UserEdit,
    NotFound,
  },
});
</script>

<style lang="scss" scoped>
</style>
