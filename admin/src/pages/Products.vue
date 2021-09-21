<template>
<div class="p-grid">
  <div class="p-col-12">
    <div class="card">
      <DataTable ref="dt" :value="list" dataKey="id" :paginator="true" :rows="10"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          :rowsPerPageOptions="[5,10,25]"
          currentPageReportTemplate="От {first} до {last} из {totalRecords} мероприятий" responsiveLayout="scroll">
        <template #header>
          <div class="table-header p-d-flex p-flex-column p-flex-md-row p-jc-md-between">
            <h5 class="p-m-0">Мероприятия</h5>
            <Button label="Новое" icon="pi pi-plus" class="p-button-raised p-mr-2 p-mb-2" @click="displayAddDialog = true"/>
          </div>
        </template>

        <Column field="id" header="id" />

        <Column field="entry.category" header="Категория">
          <template #body="{data}">
            {{ categories.find(c => c.slug === data.entry.category)?.title || data.entry.category }}
          </template>
        </Column>

        <Column field="entry.image" header="Фото">
          <template #body="{data}">
            <img v-if="data.entry.images.length > 0" :src="image.url(data.entry.images[0], 100, 100)">
          </template>
        </Column>

        <Column field="entry.start_time" header="Дата начала" />

        <Column field="entry.title" header="Заголовок" />

        <Column field="entry.slug" header="URI" />

        <Column field="entry.price" header="Цена">
          <template #body="{data}">
            {{format.currency(data.entry.price)}}
          </template>
        </Column>

        <Column field="entry.status" header="Статус">
          <template #body="{data}">
            <ProductStatus :value="data.entry.status" />
          </template>
        </Column>

        <Column>
          <template #body="{data}">
            <Button icon="pi pi-pencil" class="p-button-rounded p-button-success p-m-2" @click="$router.push(`/product/${data.id}`)" />
            <Button icon="pi pi-times" class="p-button-rounded p-button-danger p-m-2" @click="remove(data.id)" />
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</div>
<Dialog header="Добавление мероприятия" v-model:visible="displayAddDialog" :breakpoints="{'960px': '75vw'}" :style="{width: '30vw'}" :modal="true" :draggable="true" :keepInViewPort="true" :minX="200" :minY="200">
  <div class="card p-fluid p-p-0">
    <div class="p-field">
      <label for="category">Категория</label>
      <Dropdown id="category" v-model="newEntry.category" :options="categories.map(c => c.slug)" style="width: 200px">
        <template #value="{value}">
          <span v-if="value">{{ categories.find(c => c.slug === value)?.title || value }}</span>
          <span v-else>Выберите категорию</span>
        </template>
        <template #option="{option}">
          {{ categories.find(c => c.slug === option)?.title || option }}
        </template>
      </Dropdown>
    </div>
    <div class="p-field">
      <label for="start_time">Дата начала</label>
      <InputText id="start_time" type="text" v-model="newEntry.start_time" />
    </div>
    <div class="p-field">
      <label for="title">Заголовок</label>
      <InputText id="title" type="text" v-model="newEntry.title" />
    </div>
    <div class="p-field">
      <label for="slug">URI</label>
      <div class="p-inputgroup">
        <Button label="Сгененрировать" @click="generateSlug" />
        <InputText id="slug" type="text" v-model="newEntry.slug" />
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
import ProductStatus from '../components/ProductStatus.vue';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";

import format from '../modules/format';
import image from '../modules/image';
import product, { Entry, NewEntry, Category } from "../modules/product";

export default defineComponent({
  async setup() {
    const toast = useToast();
    const router = useRouter();
    const confirm = useConfirm();
    const displayAddDialog = ref<boolean>(false);
    const list = ref<{id: number, entry: Entry}[]>(await product.findAll());
    const categories = ref<Category[]>(await product.categories());
    const newEntry = reactive<NewEntry>({
      category: '',
      start_time: '',
      title: '',
      slug: '',
    });

    const remove = (id: number) => {
      confirm.require({
        message: `Вы хотите удалить мероприятие #${id}?`,
        header: 'Подтверждение удаления',
        icon: 'pi pi-info-circle',
        acceptClass: 'p-button-danger',
        acceptLabel: 'Да',
        rejectLabel: 'Нет',
        accept: async () => {
          try {
            await product.deleteById(id);
            list.value = list.value.filter(item => item.id !== id);
            toast.add({severity:'success', summary: 'Успешно удалено', detail:`Мероприятие #${id}`, life: 3000});
          } catch (error) {
            toast.add({severity:'error', summary: 'Ошибка удаления', detail:`Мероприятие #${id}`, life: 3000});
          }
        },
      });
    };

    const generateSlug = () => {
      newEntry.slug = format.toSlug(newEntry.title);
    }

    const addEntry = async () => {
      try {
        const result = await product.insertOne(newEntry);
        toast.add({severity:'success', summary: 'Успешно добавлено', detail:`Мероприятие #${result.id}`, life: 3000});
        displayAddDialog.value = false;
        router.push(`/product/${result.id}`);
      } catch (error) {
        toast.add({severity:'error', summary: 'Ошибка сохранения', detail:'Новое мероприятие', life: 3000});
      }
    }

    return {
      list,
      format,
      image,
      remove,
      displayAddDialog,
      newEntry,
      generateSlug,
      addEntry,
      categories,
    };
  },
  components: {
    ProductStatus,
    Column,
    DataTable,
    Button,
    Dialog,
    InputText,
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

