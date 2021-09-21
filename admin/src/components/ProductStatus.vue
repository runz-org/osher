<template>
  <span :class="'status-badge status-' + value">{{getLabel(value)}}</span>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { Status } from "../modules/product";

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
      if (value === Status.hidden) return 'Скрыто';
      if (value === Status.upcomming) return 'Ближайшее';
      if (value === Status.done) return 'Прошедшее';

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

  &.status-upcomming {
    background: #C8E6C9;
    color: #256029;
  }

  &.status-hidden {
    background: #FEEDAF;
    color: #8A5340;
  }

  &.status-done {
    background: #ddd;
    color: #555;
  }
}
</style>

