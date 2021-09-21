<template>
<div class="p-grid crud-demo">
  <div class="p-col-12">
    <div class="card">
      <DataTable ref="dt" :value="list" dataKey="id" :paginator="true" :rows="10"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          :rowsPerPageOptions="[5,10,25]"
          currentPageReportTemplate="От {first} до {last} из {totalRecords} билетов" responsiveLayout="scroll">
        <template #header>
          <div class="table-header p-d-flex p-flex-column p-flex-md-row p-jc-md-between">
            <h5 class="p-m-0">Билеты</h5>
          </div>
        </template>

        <Column field="created_mts" header="Дата покупки" :sortable="true">
          <template #body="{data}">
            {{format.date(data.created_mts)}}
          </template>
        </Column>

        <Column header="Мероприятие">
          <template #body="{data}">
            {{getProduct(data.product_id)?.title}}
          </template>
        </Column>

        <Column field="user_phone" header="Пользователь" :sortable="true">
          <template #body="{data}">
            {{data.user_phone}}
          </template>
        </Column>

        <Column field="price" header="Стоимость" :sortable="true">
          <template #body="{data}">
            {{format.currency(data.price)}}
          </template>
        </Column>

        <Column field="status" header="Статус">
          <template #body="{data}">
            <TicketStatus :value="data.status" />
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</div>
</template>

<script lang="ts">
import { defineComponent, ref, onUnmounted } from 'vue'
import format from '../modules/format';
import ticket, { Entry } from "../modules/ticket";
import product from "../modules/product";
import TicketStatus from "../components/TicketStatus.vue";
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';

export default defineComponent({
  async setup() {
    let stopWatchStatus: () => void = () => {};
    let stopWatchDeleted: () => void = () => {};
    let stopWatchCreated: () => void = () => {};

    onUnmounted(() => {
      stopWatchStatus();
      stopWatchDeleted();
      stopWatchCreated();
    });

    const list = ref<Entry[]>(await ticket.findAll());
    const products = await product.findAll();

    const refreshList = async () => {
      list.value = await ticket.findAll();
    }

    stopWatchStatus = ticket.watchStatus(() => {
      refreshList();
    })

    stopWatchDeleted = ticket.watchDeleted(() => {
      refreshList();
    })

    stopWatchCreated = ticket.watchCreated(() => {
      refreshList();
    })

    const getProduct = (id: number) => {
      return products.find(item => item.id === id)?.entry;
    }

    return {
      list,
      format,
      getProduct,
    };
  },
  components: {
    Column,
    DataTable,
    TicketStatus,
  },
});
</script>

<style lang="scss" scoped>
.table-header {
  display: flex;
  justify-content: space-between;
}
</style>

