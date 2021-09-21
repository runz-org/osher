<template>
  <div class="card p-fluid">
    <Toolbar>
      <template #left>
        <h5 class="p-m-lg-0">Редактирование пользователя #{{entry.phone}}</h5>
      </template>
      <template #right>
        <Button class="p-button-success" label="Сохранить" @click="save"/>
        <Button icon="pi pi-list" class="p-button-secondary p-button-text p-ml-2" @click="$router.push('/users')"/>
      </template>
    </Toolbar>
    <div class="p-fluid p-mt-4">
      <div class="p-field">
        <label for="name">Имя</label>
        <InputText id="name" type="text" v-model="entry.name"/>
      </div>
      <div class="p-field">
        <label for="status">Статус</label>
        <Dropdown id="status" v-model="entry.status" :options="statusOptions" style="width: 200px">
          <template #value="{value}">
            <UserStatus v-if="value" :value="value" />
            <span v-else>Выберите статус</span>
          </template>
          <template #option="{option}">
            <UserStatus :value="option" />
          </template>
        </Dropdown>
      </div>
      <div class="p-field">
        <label for="role">Роль</label>
        <Dropdown id="role" v-model="entry.role" :options="roleOptions" style="width: 200px">
          <template #value="{value}">
            <span v-if="value">{{value}}</span>
            <span v-else>Выберите роль</span>
          </template>
          <template #option="{option}">
            {{option}}
          </template>
        </Dropdown>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import UserStatus from '../components/UserStatus.vue';
import Dropdown from 'primevue/dropdown';
import Toolbar from 'primevue/toolbar';
import InputText from 'primevue/inputtext';
import InputMask from 'primevue/inputmask';
import Button from 'primevue/button';

import user, { Entry, Status, Role } from "../modules/user";

const statusOptions = Object.values(Status);
const roleOptions = Object.values(Role);

export default defineComponent({
  name: 'UserEdit',
  props: {
    id: {
      type: Number as PropType<number>,
      required: true,
    },
    entry: {
      type: Object as PropType<Entry>,
      required: true,
    },
    notify: {
      type: Function as PropType<(args: {
        severity: string,
        summary: string,
        detail: string,
      }) => void>
    }
  },
  setup({ id, entry, notify = () => {} }) {
    const save = async (): Promise<void> => {
      try {
        const result = await user.updateById(id, entry);

        if (result.changes === 0) {
          throw new Error(`Entry #${id} possibly deleted by other user`);
        }

        notify({severity:'success', summary: 'Успешно сохранён', detail:`Пользователь #${id}`});

      } catch (error) {
        notify({severity:'error', summary: 'Ошибка сохранения', detail:`Пользователь #${id}`});
      }
    }

    return {
      entry,
      statusOptions,
      roleOptions,
      save,
    };
  },
  components: {
    UserStatus,
    Dropdown,
    Toolbar,
    InputText,
    InputMask,
    Button,
  },
});
</script>

<style lang="scss" scoped>
</style>
