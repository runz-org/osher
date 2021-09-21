<template>
<div class="p-grid crud-demo">
  <div class="p-col-12">
    <div class="card">
      <DataTable ref="dt" :value="list" dataKey="id" :paginator="true" :rows="10"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          :rowsPerPageOptions="[5,10,25]"
          currentPageReportTemplate="От {first} до {last} из {totalRecords} сессий" responsiveLayout="scroll">
        <template #header>
          <div class="table-header p-d-flex p-flex-column p-flex-md-row p-jc-md-between">
            <h5 class="p-m-0">Сессии</h5>
          </div>
        </template>

        <Column field="session_id" header="session_id" :sortable="true">
          <template #body="{data}">
            <span v-if="data.session_id === connection_state.session_id" style="font-weight:bold;">
              {{data.session_id}} (моя)
            </span>
            <span v-else>
              {{data.session_id}}
            </span>
          </template>
        </Column>

        <Column field="mts" header="Дата" :sortable="true">
          <template #body="{data}">
            {{format.date(data.mts)}}
          </template>
        </Column>

        <Column field="ip" header="IP" />

      </DataTable>
    </div>
  </div>
</div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted, watch } from 'vue'
import format from '../modules/format';
import session, { Entry } from "../modules/session";
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import connection from '../modules/connection';

export default defineComponent({
  async setup() {
    const list = ref<Entry[]>([]);
    const updateList = async () => {
      list.value = await session.findAll();
    }
    const close: (() => void)[] = [];

    onMounted(() => {
      close.push(session.watchSessionStarted(updateList));
      close.push(session.watchSessionClosed(updateList));
    })

    onUnmounted(() => close.forEach(c => c()))

    watch(() => connection.state.session_id, session_id => {
      if (session_id) {
        setTimeout(() => updateList(), 50)
      }
    })

    await new Promise(resolve => setTimeout(resolve, 50)); // Задержка, чтобы видеть нашу сессию
    await updateList();

    return {
      list,
      format,
      connection_state: connection.state,
    };
  },
  components: {
    Column,
    DataTable,
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

