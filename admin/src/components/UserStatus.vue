<template>
  <span :class="'status-badge status-' + value">{{getLabel(value)}}</span>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { Status } from "../modules/user";

export default defineComponent({
  name: 'UserStatus',
  props: {
    value: {
      type: String as PropType<Status>,
      required: true,
    }
  },
  setup() {
    const getLabel = (value: Status): string => {
      if (Status.unverified === value) return 'Не подтвержден';
      if (Status.active === value) return 'Активен';
      if (Status.blocked === value) return 'Заблокирован';

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

  &.status-active {
    background: #C8E6C9;
    color: #256029;
  }
  &.status-blocked {
    background: #FFCDD2;
    color: #C63737;
  }

  &.status-unverified {
    background: #ddd;
    color: #555;
  }
}
</style>

