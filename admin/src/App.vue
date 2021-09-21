<template>
<div v-if="!api.state.isLogged" class="p-d-flex p-jc-center login">

  <div class="p-grid p-m-6 p-shadow-24">

    <div class="p-col-12 p-lg-4 p-d-flex p-jc-center login-left">
      <div class="layout-logo">
        <h1>O'Sher</h1>
        <h2>Женский клуб</h2>
      </div>
    </div>

    <div class="p-col-12 p-p-5 p-lg-8 login-right">
      <Auth />
    </div>
  </div>
</div>

<div v-if="api.state.isLogged && !user.state.value" class="layout-wrapper layout-static layout-static-sidebar-inactive">
  <div class="layout-topbar">
    <div class="layout-topbar-icons">
      <Connection />
    </div>
  </div>

  <div class="layout-main">
    <Skeleton />
  </div>
</div>

<div v-if="api.state.isLogged && user.state.value" :class="containerClass" @click="onWrapperClick">
  <Toast />
  <ConfirmDialog />

  <div class="layout-topbar">
    <button class="p-link layout-menu-button" @click="onMenuToggle">
      <span class="pi pi-bars"></span>
    </button>
    <div class="layout-topbar-icons">
      <span class="balance">O'Sher</span>
      <Connection />
    </div>
  </div>

  <transition name="layout-sidebar">
    <div class="layout-sidebar layout-sidebar-dark" @click="onSidebarClick" v-show="isSidebarVisible()">
      <div class="layout-logo">
        <router-link to="/">
          <h1>O'Sher</h1>
          <h2>Женский клуб</h2>
        </router-link>
      </div>

      <div class="layout-profile">
        <button class="p-link layout-profile-link" @click="onProfileToggle">
          <span class="username">{{user.state.value.name}}</span>
          <i class="pi pi-fw pi-cog"></i>
        </button>

        <transition name="layout-submenu-wrapper">
          <ul v-show="profileExpanded">
            <li><button class="p-link" @click="api.logout()"><i class="pi pi-fw pi-power-off"></i><span>Выйти</span></button></li>
          </ul>
        </transition>
        
      </div>
      <div class="layout-menu-container">
        <AppMenu :items="menu.tree()" class="layout-menu" :root="true" :notifyItemClick="onMenuItemClick" />
      </div>
    </div>
  </transition>

  <div class="layout-main">
    <router-view v-slot="{ Component }" :key="$route.fullPath">
      <Suspense timeout="0">
        <template #default>
          <component :is="Component" />
        </template>
        <template #fallback>
          <Skeleton />
        </template>
      </Suspense>
    </router-view>
  </div>
</div>
</template>

<script lang="ts">
import { ref, computed, onBeforeUpdate, defineComponent } from 'vue'
import AppMenu from './components/AppMenu.vue';
import Skeleton from './components/Skeleton.vue';
import menu from './modules/menu';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';
import api from './modules/api';
import Connection from './components/Connection.vue';
import Auth from './components/Auth.vue';
import user from './modules/user';

export default defineComponent({
  setup() {
    const profileExpanded = ref<boolean>(false);
    const staticMenuActive = ref<boolean>(false);
    const mobileMenuActive = ref<boolean>(false);
    const menuClick = ref<boolean>(false);

    const onProfileToggle = () => {
      profileExpanded.value = !profileExpanded.value;
    };

    const isDesktop = () => window.innerWidth > 1024;

    const onWrapperClick = () => {
      if (!menuClick.value) {
        mobileMenuActive.value = false;
      }

      menuClick.value = false;
    };

    const onMenuToggle = () => {
      menuClick.value = true;

      if (!isDesktop()) {
        mobileMenuActive.value = !mobileMenuActive.value;
        return;
      }

      staticMenuActive.value = !staticMenuActive.value;
    };

    const onSidebarClick = () => {
      menuClick.value = true;
    };

    const onMenuItemClick = () => {
      mobileMenuActive.value = false;
    };

    const isSidebarVisible = () => {
      if (!isDesktop()) {
        return true;
      }

      return staticMenuActive.value;
    };

    const containerClass = computed(() => (['layout-wrapper', {
      'layout-static': true,
      'layout-static-sidebar-inactive': !staticMenuActive.value,
      'layout-mobile-sidebar-active': mobileMenuActive.value,
    }]));

    onBeforeUpdate(() => {
      const className = 'body-overflow-hidden';

      if (mobileMenuActive.value) {
        if (document.body.classList) {
          document.body.classList.add(className);

        } else {
          document.body.className += ' ' + className;
        }
      } else {
        if (document.body.classList) {
          document.body.classList.remove(className);

        } else {
          document.body.className = document.body.className.replace(
            new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'),
            ' '
          );
        }
      }
    });

    return {
      menu,
      profileExpanded,
      onWrapperClick,
      onMenuToggle,
      onSidebarClick,
      onMenuItemClick,
      isSidebarVisible,
      onProfileToggle,
      containerClass,
      api,
      user,
    };
  },
  components: {
    AppMenu,
    Toast,
    ConfirmDialog,
    Skeleton,
    Connection,
    Auth,
  },
})
</script>

<style lang="scss" scoped>
@import "./assets/layout/_variables.scss";
@import "./assets/layout/sass/_mixins.scss";

.layout-logo {
  h1 {
    margin: 0;
    padding: 0;
    font-size: 26px;
    color: #fff;
  }
  h2 {
    margin: 0;
    padding: 0;
    font-size: 10px;
    color: #fff;
  }
}
.layout-topbar {
  .balance {
    font-size: 16px;
    font-weight: bold;
  }
}

.login {
  .login-left {
    @include linear-gradient($menuDarkBgColorFirst, $menuDarkBgColorLast);
  }
}
</style>
