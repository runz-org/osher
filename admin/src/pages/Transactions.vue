<template>
<div class="p-grid crud-demo">
  <div class="p-col-12">
    <div class="card">
      <DataTable ref="dt" :value="list" dataKey="id" :paginator="true" :rows="10"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          :rowsPerPageOptions="[5,10,25]"
          currentPageReportTemplate="От {first} до {last} из {totalRecords} транзакций" responsiveLayout="scroll">
        <template #header>
          <div class="table-header p-d-flex p-flex-column p-flex-md-row p-jc-md-between">
            <h5 class="p-m-0">Платежи</h5>
          </div>
        </template>

        <Column field="id" header="id" />

        <Column field="register_mts" header="Дата" :sortable="true">
          <template #body="{data}">
            {{format.date(data.register_mts)}}
          </template>
        </Column>

        <Column field="amount" header="Сумма" :sortable="true">
          <template #body="{data}">
            <span :class="'amount-' + (data.amount < 0 ? 'minus' : 'plus')">
              {{format.currency(data.amount)}}
            </span>
          </template>
        </Column>

        <Column field="status" header="Статус">
          <template #body="{data}">
            <TransactionStatus :value="data.status" />
          </template>
        </Column>

        <Column field="maskedPan" header="Номер карты" />

        <Column field="expiration" header="Срок карты" />

        <Column field="cardholderName" header="ФИО" />
      </DataTable>
    </div>
  </div>
</div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import format from '../modules/format';
import transaction, { Entry } from "../modules/transaction";
import TransactionStatus from "../components/TransactionStatus.vue";
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';

export default defineComponent({
  async setup() {
    const list = ref<Entry[]>(await transaction.findAll());

    return {
      list,
      format,
    };
  },
  components: {
    Column,
    DataTable,
    TransactionStatus,
  },
});
</script>

<style lang="scss" scoped>
.table-header {
  display: flex;
  justify-content: space-between;
}
.amount-plus {
  color: #256029;
}
.amount-minus {
  color: #C63737;
}
</style>

