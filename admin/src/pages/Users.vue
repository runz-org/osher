<template>
<div class="p-grid">
  <div class="p-col-12">
    <div class="card">
      <DataTable ref="dt" :value="list" dataKey="id" :paginator="true" :rows="10"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          :rowsPerPageOptions="[5,10,25]"
          currentPageReportTemplate="От {first} до {last} из {totalRecords} пользователей" responsiveLayout="scroll">
        <template #header>
          <div class="table-header p-d-flex p-flex-column p-flex-md-row p-jc-md-between">
            <h5 class="p-m-0">Пользователи</h5>
            <Button label="Новый" icon="pi pi-plus" class="p-button-raised p-mr-2 p-mb-2" @click="displayAddDialog = true"/>
          </div>
        </template>

        <Column field="entry.phone" header="Телефон" />

        <Column field="entry.name" header="Имя" />

        <Column field="entry.status" header="Статус">
          <template #body="{data}">
            <UserStatus :value="data.entry.status" />
          </template>
        </Column>

        <Column field="entry.role" header="Роль" />

        <Column field="entry.created_mts" header="Создан" :sortable="true">
          <template #body="{data}">
            {{format.date(data.entry.created_mts)}}
          </template>
        </Column>

        <Column>
          <template #body="{data}">
            <Button icon="pi pi-pencil" class="p-button-rounded p-button-success p-m-2" @click="$router.push(`/user/${data.id}`)" />
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</div>
<Dialog header="Добавление пользователя" v-model:visible="displayAddDialog" :breakpoints="{'960px': '75vw'}" :style="{width: '30vw'}" :modal="true" :draggable="true" :keepInViewPort="true" :minX="200" :minY="200">
  <div class="card p-fluid p-p-0">
    <div class="p-field">
      <label for="phone">Телефон</label>
      <div class="p-inputgroup">
        <span class="p-inputgroup-addon">+7</span>
        <InputMask v-model="newEntry.phone" id="phone" mask="(999) 999-9999" placeholder="(999) 999-9999" />
      </div>
    </div>
  </div>
  <template #footer>
    <Button label="Добавить" icon="pi pi-check" class="p-button-primary" @click="addEntry" />
    <Button label="Закрыть" @click="displayAddDialog = false" icon="pi pi-times" class="p-button-secondary"/>
  </template>
</Dialog>
</template>

<script lang="ts">
import { defineComponent, ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import UserStatus from '../components/UserStatus.vue';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputMask from 'primevue/inputmask';
import Dropdown from 'primevue/dropdown';
import { useToast } from "primevue/usetoast";

import format from '../modules/format';
import image from '../modules/image';
import user, { Entry, NewEntry } from "../modules/user";

export default defineComponent({
  async setup() {
    const toast = useToast();
    const router = useRouter();
    const displayAddDialog = ref<boolean>(false);
    const list = ref<{id: number, entry: Entry}[]>(await user.findAll());
    const newEntry = reactive<NewEntry>({
      phone: '',
    });

    const normalizePhone = (phone: string): string => {
      const phoneParts = phone.match(/\d+/g);
      return null === phoneParts ? '' : '7' + phoneParts.join('');
    }

    const addEntry = async () => {
      try {
        const result = await user.insertOne({...newEntry, phone: normalizePhone(newEntry.phone)});
        toast.add({severity:'success', summary: 'Успешно добавлен', detail:`Пользователь #${result.id}`, life: 3000});
        displayAddDialog.value = false;
        router.push(`/user/${result.id}`);
      } catch (error) {
        toast.add({severity:'error', summary: 'Ошибка сохранения', detail:'Новый пользователь', life: 3000});
      }
    }

    return {
      list,
      format,
      image,
      displayAddDialog,
      newEntry,
      addEntry,
    };
  },
  components: {
    UserStatus,
    Column,
    DataTable,
    Button,
    Dialog,
    InputMask,
    Dropdown,
  },
});
</script>

<style lang="scss" scoped>
.table-header {
  display: flex;
  justify-content: space-between;
}
</style>

