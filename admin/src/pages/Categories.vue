<template>
<div class="p-grid">
  <div class="p-col-12">
    <div class="card">
      <DataTable ref="dt" :value="list" dataKey="slug" :paginator="true" :rows="10"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          :rowsPerPageOptions="[5,10,25]"
          currentPageReportTemplate="От {first} до {last} из {totalRecords} категорий" responsiveLayout="scroll">
        <template #header>
          <div class="table-header p-d-flex p-flex-column p-flex-md-row p-jc-md-between">
            <h5 class="p-m-0">Категории</h5>
            <Button label="Новая" icon="pi pi-plus" class="p-button-raised p-mr-2 p-mb-2" @click="openDialog({slug: '', title: ''}, true)"/>
          </div>
        </template>

        <Column field="title" header="Наименование" :sortable="true" />

        <Column field="slug" header="URI" :sortable="true" />

        <Column>
          <template #body="{data}">
            <Button icon="pi pi-pencil" class="p-button-rounded p-button-success p-m-2" @click="openDialog(data, false)" />
            <Button icon="pi pi-times" class="p-button-rounded p-button-danger p-m-2" @click="remove(data.slug)" />
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</div>
<Dialog :header="dialog.new ? 'Добавление категории' : `Редактирование категории ${dialogEntry.slug}`" v-model:visible="dialog.visible" :breakpoints="{'960px': '75vw'}" :style="{width: '30vw'}" :modal="true" :draggable="true" :keepInViewPort="true" :minX="200" :minY="200">
  <div class="card p-fluid p-p-0">
    <div class="p-field">
      <label for="title">Наименование</label>
      <InputText id="title" type="text" v-model="dialogEntry.title" />
    </div>
    <div v-if="dialog.new" class="p-field">
      <label for="slug">URI</label>
      <div class="p-inputgroup">
        <Button label="Сгененрировать" @click="dialogEntry.slug = format.toSlug(dialogEntry.title)" />
        <InputText id="slug" type="text" v-model="dialogEntry.slug" />
      </div>
    </div>
  </div>
  <template #footer>
    <Button :label="dialog.new ? 'Добавить' : 'Сохранить'" icon="pi pi-check" class="p-button-primary" @click="save()" />
    <Button label="Закрыть" @click="dialog.visible = false" icon="pi pi-times" class="p-button-secondary"/>
  </template>
</Dialog>
</template>

<script lang="ts">
import { defineComponent, ref, reactive } from 'vue'
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";

import format from '../modules/format';
import product, { Category } from "../modules/product";

export default defineComponent({
  async setup() {
    const toast = useToast();
    const confirm = useConfirm();
    const list = ref<Category[]>(await product.categories());

    const dialog = reactive({
      visible: false,
      new: true,
    });

    const dialogEntry = reactive<Category>({
      slug: '',
      title: '',
    });

    const openDialog = (category: Category, isNew: boolean) => {
      dialogEntry.slug = category.slug;
      dialogEntry.title = category.title;
      dialog.new = isNew;
      dialog.visible = true;
    }

    const save = async () => {
      try {
        if (dialog.new) {
          await product.insertCategory(dialogEntry);
          toast.add({severity:'success', summary: 'Успешно добавлена', detail:`Категория #${dialogEntry.title}`, life: 3000});
          list.value.push(dialogEntry);
        } else {
          await product.updateCategory(dialogEntry.slug, dialogEntry);
          toast.add({severity:'success', summary: 'Успешно изменена', detail:`Категория #${dialogEntry.title}`, life: 3000});
          const cat = list.value.find(c => c.slug === dialogEntry.slug);
          if (cat) cat.title = dialogEntry.title;
        }
        dialog.visible = false;
      } catch (error) {
        toast.add({severity:'error', summary: 'Ошибка сохранения', detail:'Новая категория', life: 3000});
      }
    }

    const remove = (slug: string) => {
      confirm.require({
        message: `Вы хотите удалить категорию #${slug}?`,
        header: 'Подтверждение удаления',
        icon: 'pi pi-info-circle',
        acceptClass: 'p-button-danger',
        acceptLabel: 'Да',
        rejectLabel: 'Нет',
        accept: async () => {
          try {
            await product.deleteCategory(slug);
            list.value = list.value.filter(item => item.slug !== slug);
            toast.add({severity:'success', summary: 'Успешно удалена', detail:`Категория #${slug}`, life: 3000});
          } catch (error) {
            toast.add({severity:'error', summary: 'Ошибка удаления', detail:`Категория #${slug}`, life: 3000});
          }
        },
      });
    };

    return {
      dialog,
      dialogEntry,
      openDialog,
      list,
      format,
      save,
      remove,
    };
  },
  components: {
    Column,
    DataTable,
    Button,
    Dialog,
    InputText,
  },
});
</script>

<style lang="scss" scoped>
.table-header {
  display: flex;
  justify-content: space-between;
}
</style>

