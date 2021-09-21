<template>
  <Button :disabled="wait">
    <span class="p-text-center p-d-block" style="width:100%;"><slot></slot></span>
    <span v-if="wait" class="p-text-center p-d-block" style="width:100%;position:absolute;left:0;">
      <ProgressSpinner style="width:2em;height:2em;" strokeWidth="5" animationDuration="5s" />
    </span>
  </Button>
</template>

<script lang="ts">
import {defineComponent, PropType} from "vue";
import ProgressSpinner from "primevue/progressspinner";
import Button from "primevue/button";

export default defineComponent({
  name: 'RedButton',
  props: {
    wait: {
      type: Boolean as PropType<boolean>,
    }
  },
  setup() {
    return {
    }
  },
  components: {
    ProgressSpinner,
    Button,
  }
})
</script>

<style lang="scss" scoped>
button {
  font-size: 1.3em;

  padding: 1em 1.5em;

  border: 1px;
  border-radius: 0.3em;
  background-color: #ed1c23;
  color: #EEE;

  &:enabled:hover {
    background-color: #ed1c23;
    color: #EEE;
  }

  cursor: pointer;
  ::v-deep(.p-progress-spinner-circle) {
    stroke: #fff;
    animation: p-progress-spinner-dash 1.5s ease-in-out infinite;
  }
}
</style>
