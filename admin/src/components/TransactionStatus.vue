<template>
  <span :class="'status-badge status-' + value">{{getLabel(value)}}</span>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { Status } from "../modules/transaction";

export default defineComponent({
  name: 'TransactionStatus',
  props: {
    value: {
      type: String as PropType<Status>,
      required: true,
    }
  },
  setup() {
    const getLabel = (value: Status): string => {
      if (value === Status.wait_approve) return 'Ожидает подтверждения';
      if (value === Status.approved) return 'Подтверждено';
      if (value === Status.wait_deposit) return 'Ожидает завершения';
      if (value === Status.deposited) return 'Оплачено';
      if (value === Status.wait_reverse) return 'Ожидает отмены';
      if (value === Status.reversed) return 'Отменено';
      if (value === Status.wait_refund) return 'Ожидает возврата средств';
      if (value === Status.refunded) return 'Средства возвращены';
      if (value === Status.declined) return 'Отклонено';

      return value;
    }

    return {
      getLabel,
    };
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

  &.status-deposited {
    background: #C8E6C9;
    color: #256029;
  }
  &.status-approved {
    background: #C8E6C9;
    color: #256029;
  }

  &.status-wait_approve {
    background: #FEEDAF;
    color: #8A5340;
  }
  &.status-wait_deposit {
    background: #FEEDAF;
    color: #8A5340;
  }
  &.status-wait_reverse {
    background: #FEEDAF;
    color: #8A5340;
  }
  &.status-wait_refund {
    background: #FEEDAF;
    color: #8A5340;
  }

  &.status-reversed {
    background: #ddd;
    color: #555;
  }
  &.status-refunded {
    background: #ddd;
    color: #555;
  }
  &.status-declined {
    color: #FFCDD2;
    background: #C63737;
  }
}
</style>

