<template>
<ul v-if="items">
  <template v-for="(item,i) of items">
    <li v-if="visible(item) && !item.separator" :key="i" :class="[{'active-menuitem': activeIndex === i && !item.to && !item.disabled}]" role="none">
      <div v-if="item.items && root===true" class='arrow'></div>

      <router-link v-if="item.to" :to="item.to" :class="[item.class, 'p-ripple',{'active-route': activeIndex === i, 'p-disabled': item.disabled}]" :style="item.style"
        @click="onMenuItemClick($event,item,i)" :target="item.target" exact role="menuitem" v-ripple>
        <i :class="item.icon"></i>
        <span>{{item.label}}</span>
        <i v-if="item.items" class="pi pi-fw pi-angle-down menuitem-toggle-icon"></i>
        <span v-if="item.badge" class="menuitem-badge">{{item.badge}}</span>
      </router-link>

      <a v-if="!item.to" :href="item.url||'#'" :style="item.style" :class="[item.class, 'p-ripple', {'p-disabled': item.disabled}]"
        @click="onMenuItemClick($event,item,i)" :target="item.target" role="menuitem" v-ripple>
        <i :class="item.icon"></i>
        <span>{{item.label}}</span>
        <i v-if="item.items" class="pi pi-fw pi-angle-down menuitem-toggle-icon"></i>
        <span v-if="item.badge" class="menuitem-badge">{{item.badge}}</span>
      </a>

      <transition name="layout-submenu-wrapper">
        <AppMenu v-show="activeIndex === i" :items="visible(item) && item.items" @menuitem-click="onMenuItemClick"></AppMenu>
      </transition>
    </li>
    <li class="p-menu-separator" :style="item.style" v-if="visible(item) && item.separator" :key="'separator' + i" role="separator"></li>
  </template>
</ul>
</template>

<script lang="ts">
import { ref, defineComponent, PropType } from 'vue';
import { Item } from '../modules/menu';

export default defineComponent({
  name: 'AppMenu',
  props: {
    items: Array as PropType<Item[]>,
    root: {
      type: Boolean,
      default: false,
    },
    notifyItemClick: {
      type: Function as PropType<() => void>
    }
  },
  setup({ notifyItemClick = () => {} }) {
    const activeIndex = ref<number | null>(null);
    const onMenuItemClick = (event: Event, item: Item, index: number | null = null) => {
      if (item.disabled) {
        event.preventDefault();
        return;
      }

      if (null !== index) {
        if (!item.to && !item.url) {
          event.preventDefault();
        }

        if (item.command) {
          item.command();
        }

        activeIndex.value = index === activeIndex.value ? null : index;
      }

      if (!item.items) {
        notifyItemClick();
      }
    };
    const visible = (item: Item) => {
      return (typeof item.visible === 'function' ? item.visible() : item.visible !== false);
    };

    return {
      activeIndex,
      onMenuItemClick,
      visible,
    };
  },
})
</script>
