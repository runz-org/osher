<template>
  <h1 class="p-mb-6">{{ entry.title }}</h1>
  <div class="images p-my-4">
    <Galleria :value="entry.images" :responsiveOptions="responsiveOptions" :numVisible="5" containerStyle="max-width: 640px"
      :showThumbnails="false" :showIndicators="entry.images.length > 1" :changeItemOnIndicatorHover="true" :showIndicatorsOnItem="true">
      <template #item="slotProps">
        <img :src="format.imageUrl(slotProps.item, 640, 640)" style="width: 100%; object-fit: cover; display: block;" />
      </template>
    </Galleria>
  </div>
  <div class="start_time p-my-2">
    {{ entry.start_time }}
  </div>
  <RedButton @click="pay" :wait="payButtonWait" style="height: 70px">Участвовать {{format.currency(entry.price)}}</RedButton>
  <div class="content" v-html="entry.content"></div>

  <div class="p-my-2">Локация: {{ entry.location }}</div>

  <div ref="mapElement" class="p-mb-6" style="height:320px"></div>

  <router-link :to="`/events/`">
    <button class="p-link">Посмотреть другие мероприятия</button>
  </router-link>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, watch } from "vue";
import format from '../modules/format';
import ticket from '../modules/ticket';
import RedButton from "../components/RedButton.vue";
import Galleria from "primevue/galleria";
import { Entry } from '../modules/product';
import loginDialog from '../modules/loginDialog';
import api from '../modules/api';

const responsiveOptions = [{
  breakpoint: '1024px',
  numVisible: 5
}, {
  breakpoint: '768px',
  numVisible: 3
}, {
  breakpoint: '560px',
  numVisible: 1
}];

export default defineComponent({
  props: {
    id: {
      type: Number as PropType<number>,
      required: true,
    },
    entry: {
      type: Object as PropType<Entry>,
      required: true,
    },
  },
  setup({ id, entry }) {
    const payButtonWait = ref<boolean>(false);
    const mapElement = ref<HTMLElement | null>(null);

    const auth = (): Promise<void> => {
      loginDialog.state.isOpen = true;

      return new Promise(resolve => {
        const stopWatch = watch(() => loginDialog.state.isOpen, isOpen => {
          if (!isOpen) {
            stopWatch();
            resolve();
          }
        });
      });
    }

    const pay = async () => {
      if (!api.state.isLogged) {
        await auth();
      }

      if (api.state.isLogged) {
        payButtonWait.value = true;
        window.location.href = await ticket.create(id, 1);
      }
    }

    const getMapApi = async (): Promise<typeof ymaps> => {
      const w = window as any;
      if (w.ymaps) return w.ymaps;

      //const apiKey = 'a9721c04-714f-46f5-9b69-cc2ed6eab06d';
      const apiKey = '';
      const lang = 'ru_RU';
      const version = '2.1';
      const coordorder = 'latlong';
      const debug = false;
      const mode = debug ? 'debug' : 'release';
      const src = `https://api-maps.yandex.ru/${version}/?lang=${lang}&apikey=${apiKey}&mode=${mode}&coordorder=${coordorder}`;

      return new Promise((resolve, reject) => {
        const script = w.document.createElement('script');
        script.setAttribute('src', src);
        script.setAttribute('async', '');
        script.setAttribute('defer', '');
        script.setAttribute('id', 'ymaps-script');
        script.onload = () => w.ymaps ? w.ymaps.ready(() => resolve(w.ymaps), reject) : reject('Could not find ymaps object');
        script.onerror = reject;
        w.document.head.appendChild(script);
      });
    }

    if (!api.ssr) {
      const stop = watch (() => mapElement.value, async el => {
        if (null !== el) {
          stop();

          const mapApi = await getMapApi();
          const map = new mapApi.Map(el, {
            center: entry.geoloc,
            zoom: 15,
          });

          map.controls.remove('searchControl');

          const placemark = new mapApi.Placemark(entry.geoloc, {
            hintContent: entry.location,
          }, {
            preset: 'islands#redDotIcon',
          } as any);

          map.geoObjects.add(placemark);
        }
      })
    }

    return {
      format,
      responsiveOptions,
      pay,
      payButtonWait,
      mapElement,
    }
  },
  components: {
    RedButton,
    Galleria,
  },
})
</script>

<style lang="scss" scoped>
.images {
  img {
    width: 300px;
    height: 337px;
    object-fit: fit;
  }
}
</style>
