<template>
  <span :class="'p-text-center status-badge status-' + value">
    {{getLabel(value)}}
    <ProgressSpinner v-if="Status.wait_deposit === value" style="width:1em;height:1em;" strokeWidth="5" animationDuration="5s" />
  </span>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { Status } from "../modules/ticket";
import ProgressSpinner from "primevue/progressspinner";

export default defineComponent({
  name: 'ProductStatus',
  props: {
    value: {
      type: String as PropType<Status>,
      required: true,
    }
  },
  setup() {
    const getLabel = (value: Status): string => {
      if (value === Status.wait_deposit) return 'Ожидает оплаты';
      if (value === Status.active) return 'Оплачен';
      if (value === Status.done) return 'Архив';

      return value;
    }

    return {
      getLabel,
      Status,
    };
  },
  components: {
    ProgressSpinner,
  }
});
</script>

<style lang="scss" scoped>
.status-badge {
  border-radius: 2px;
  padding: .25em .5rem;
  text-transform: uppercase;
  font-weight: 700;
  font-size: 12px;
  letter-spacing: .3px;
  width: 15em;

  &.status-active {
    background: #C8E6C9;
    color: #256029;
  }

  &.status-wait_deposit {
    background: #FEEDAF;
    color: #8A5340;
  }

  &.status-done {
    background: #ddd;
    color: #555;
  }

  ::v-deep(.p-progress-spinner-circle) {
    stroke: #8A5340;
    animation: p-progress-spinner-dash 1.5s ease-in-out infinite;
  }
}
</style>

