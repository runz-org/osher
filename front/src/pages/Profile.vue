<template>
<div class="card p-fluid">
  <div class="p-field">
    <label for="name">Имя</label>
    <InputText id="name" type="text" v-model="entry.name"/>
  </div>
  <Button :enabled="saveEnabled" class="p-button-raised" label="Сохранить" @click="save" style="width:10em;" />
</div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import api from '../modules/api';
import user from '../modules/user';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import { useToast } from "primevue/usetoast";

export default defineComponent({
  async setup() {
    const toast = useToast();
    const entry = await user.me();
    const saveEnabled = ref<boolean>(true);
    const save = async () => {
      try {
        saveEnabled.value = false;
        await user.updateProfile({
          name: entry.name,
        });
        toast.add({severity:'success', summary: 'Профиль сохранён', life: 3000});
      } catch (error) {
        toast.add({severity:'error', summary: 'При сохранении профиля произошла ошибка', life: 3000});
      } finally {
        saveEnabled.value = true;
      }
    }

    return {
      api,
      entry,
      save,
      saveEnabled,
    }
  },
  components: {
    Button,
    InputText,
  }
})
</script>

<style lang="scss" scoped>
</style>
