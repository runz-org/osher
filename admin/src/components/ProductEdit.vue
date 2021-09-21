<template>
  <div class="card p-fluid">
    <Toolbar>
      <template #left>
        <h5 class="p-m-lg-0">Редактирование мероприятия #{{id}}</h5>
      </template>
      <template #right>
        <Button class="p-button-success" label="Сохранить" @click="save"/>
        <Button icon="pi pi-list" class="p-button-secondary p-button-text p-ml-2" @click="$router.push('/products')"/>
      </template>
    </Toolbar>
    <div class="p-fluid p-mt-4">
      <div class="p-field">
        <label for="category">Категория</label>
        <Dropdown id="category" v-model="entry.category" :options="categories.map(c => c.slug)" style="width: 200px">
          <template #value="{value}">
            <span v-if="value">{{ categories.find(c => c.slug === value)?.title || value }}</span>
            <span v-else>Выберите категорию</span>
          </template>
          <template #option="{option}">
            {{ categories.find(c => c.slug === option)?.title || option }}
          </template>
        </Dropdown>
      </div>
      <div class="p-field">
        <label for="start_time">Дата начала</label>
        <InputText id="start_time" type="text" v-model="entry.start_time"/>
      </div>
      <div class="p-field">
        <label for="title">Заголовок</label>
        <InputText id="title" type="text" v-model="entry.title"/>
      </div>
      <div class="p-field">
        <label for="slug">URI</label>
        <div class="p-inputgroup">
          <Button label="Сгененрировать" @click="generateSlug" />
          <InputText id="slug" type="text" v-model="entry.slug"/>
        </div>
      </div>
      <div class="p-field">
        <label for="price">Цена</label>
        <div class="p-inputgroup" style="width: 200px">
          <InputNumber id="price" v-model="entry.price" mode="decimal" :useGrouping="false" />
          <span class="p-inputgroup-addon">,00</span>
          <span class="p-inputgroup-addon">₽</span>
        </div>
      </div>
      <div class="p-field">
        <Dropdown id="status" v-model="entry.status" :options="statusOptions" style="width: 200px">
          <template #value="{value}">
            <ProductStatus v-if="value" :value="value" />
            <span v-else>Выберите статус</span>
          </template>
          <template #option="{option}">
            <ProductStatus :value="option" />
          </template>
        </Dropdown>
      </div>
      <div class="p-field">
        <label>Краткое описание</label>
        <Editor v-model="entry.description" editorStyle="height: 320px"/>
      </div>
      <div class="p-field">
        <label>Полное описание</label>
        <Editor v-model="entry.content" editorStyle="height: 320px"/>
      </div>
      <div class="p-field">
        <label for="location">Локация</label>
        <div class="p-inputgroup">
          <InputText id="location" type="text" v-model="entry.location"/>
          <span class="p-inputgroup-addon">({{ entry.geoloc[0] }}, {{ entry.geoloc[1] }})</span>
        </div>
        <div ref="mapElement" class="p-mt-2" style="height:320px"></div>
      </div>
    </div>
    <div class="p-mt-6">
      <Divider type="dashed" />
    </div>
    <FileUpload :key="`fileUpload${fileUploadCount}`" mode="basic" :customUpload="true" @uploader="uploader" :auto="true" accept="image/*" :maxFileSize="1000000" chooseLabel="Загрузить изображение" class="p-mb-2" />
    <Galleria :value="entry.images" v-model:activeIndex="activeImageIndex" :numVisible="5" thumbnailsPosition="top">
      <template #item="{item}">
        <div class="image-full">
          <div class="panel p-my-2">
            <Button icon="pi pi-arrow-left" class="p-button-rounded p-button-info p-button-text"  @click="imageMove(item, -1)" />
            <Button icon="pi pi-arrow-right" class="p-button-rounded p-button-info p-button-text" @click="imageMove(item, 1)" />
            <Button icon="pi pi-times" class="p-button-rounded p-button-danger" @click="imageDelete(item)" />
          </div>
          <a :href="image.url(item, 2000, 2000)" target="_blank">
            <img :src="image.url(item, 640, 640)" />
          </a>
        </div>
      </template>
      <template #thumbnail="{item}">
        <div style="width: 100px; height: 100px;" class="p-m-2">
          <img :src="image.url(item, 100, 100)" style="object-fit: contain;"/>
        </div>
      </template>
    </Galleria>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, PropType, watch } from 'vue'
import ProductStatus from '../components/ProductStatus.vue';
import Dropdown from 'primevue/dropdown';
import Editor from 'primevue/editor';
import Galleria from 'primevue/galleria';
import FileUpload from 'primevue/fileupload';
import Toolbar from 'primevue/toolbar';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';
import Divider from 'primevue/divider';

import product, { Entry, Status, Images, Category, GeoLocation } from "../modules/product";
import image from "../modules/image";
import format from "../modules/format";

const statusOptions = Object.values(Status);

export default defineComponent({
  name: 'ProductEdit',
  props: {
    id: {
      type: Number as PropType<number>,
      required: true,
    },
    entry: {
      type: Object as PropType<Entry>,
      required: true,
    },
    categories: {
      type: Array as PropType<Category[]>,
      required: true,
    },
    notify: {
      type: Function as PropType<(args: {
        severity: string,
        summary: string,
        detail: string,
      }) => void>
    }
  },
  setup({ id, entry, notify = () => {} }) {
    const fileUploadCount = ref<number>(0);
    const activeImageIndex = ref<number>(0);
    const mapElement = ref<HTMLElement | null>(null);

    const update = async (data: Partial<Entry>): Promise<void> => {
      const result = await product.updateById(id, data);

      if (result.changes === 0) {
        throw new Error(`Entry #${id} possibly deleted by other user`);
      }
    }

    const save = async (): Promise<void> => {
      try {
        const {images, ...data} = entry;
        await update(data);
        notify({severity:'success', summary: 'Успешно сохранено', detail:`Мероприятие #${id}`});

      } catch (error) {
        notify({severity:'error', summary: 'Ошибка сохранения', detail:`Мероприятие #${id}`});
      }
    }

    const uploader = async (event: Event & { files: unknown[] }): Promise<void> => {
      try {
        const filename = await image.upload(event.files[0]);

        if (entry.images.includes(filename)) {
          return;
        }

        const images = [...entry.images, filename];

        // todo здесь может быть ексепшн и файл останется на серваке
        await update({ images });

        entry.images = images;

        // хак для очистки апдлоадилки (перерендериваем ее), там архитектурный косяк в компоненте
        fileUploadCount.value++;

        activeImageIndex.value = entry.images.indexOf(filename);
        notify({severity: 'success', summary: 'Успешно!', detail: 'Файл загружен'});
      } catch (error) {
        // хак для очистки апдлоадилки (перерендериваем ее), там архитектурный косяк в компоненте
        fileUploadCount.value++;

        notify({severity: 'error', summary: 'Ошибка!', detail: 'Файл не загружен'});
      }
    }

    const imageDelete = async (filename: string): Promise<void> => {
      const index = entry.images.indexOf(filename);
      const isLast = index === (entry.images.length - 1);
      const images = entry.images.filter(image => image !== filename);

      try {
        await update({ images });

        if (isLast && activeImageIndex.value > 0) {
          activeImageIndex.value--;
        }

        entry.images = images;

      } catch (error) {
        notify({severity: 'error', summary: 'Ошибка!', detail: 'Ошибка удаления изображения'});
      }
    }

    const imageMove = async (filename: string, direction: 1|-1): Promise<void> => {
      const index = entry.images.indexOf(filename);

      if (
        (1 === direction && (entry.images.length - 1) === index) ||
        (-1 === direction && 0 === index)
      ) {
        return;
      }

      let images: Images = [];

      if (1 === direction) {
        images = [
          ...entry.images.slice(0, index),
          entry.images[index + 1],
          entry.images[index],
          ...entry.images.slice(index + 2),
        ];
      } else {
        images = [
          ...(index > 1 ? entry.images.slice(0, index - 1) : []),
          entry.images[index],
          entry.images[index - 1],
          ...entry.images.slice(index + 1),
        ];
      }

      try {
        await update({ images });
        activeImageIndex.value += direction;
        entry.images = images;
      } catch (error) {
        notify({severity: 'error', summary: 'Ошибка!', detail: 'Ошибка сортировки изображения'});
      }
    }

    const generateSlug = (): void => {
      entry.slug = format.toSlug(entry.title);
    }

    const getMapApi = async (): Promise<typeof ymaps> => {
      const w = window as any;
      if (w.ymaps) return w.ymaps;

      const apiKey = 'a9721c04-714f-46f5-9b69-cc2ed6eab06d';
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

    const stop = watch (() => mapElement.value, async el => {
      if (null !== el) {
        stop();

        const mapApi = await getMapApi();
        const map = new mapApi.Map(el, {
          center: entry.geoloc,
          zoom: 15,
        });
        const searchControl = map.controls.get('searchControl') as ymaps.control.SearchControl;
        (searchControl.options as any).set('noPlacemark', true);

        // Результаты поиска будем помещать в коллекцию.
        const searchResults = new mapApi.GeoObjectCollection(undefined, {
          hintContentLayout: ymaps.templateLayoutFactory.createClass('$[properties.name]')
        });

        const placemark = new mapApi.Placemark(entry.geoloc, {
          name: entry.location,
        }, {
          preset: 'islands#redDotIcon',
        } as any);
        searchResults.add(placemark);

        map.geoObjects.add(searchResults);

        // При клике по найденному объекту метка становится красной.
        searchResults.events.add('click', e => {
          e.preventDefault();
          e.stopPropagation();
          const target = e.get('target') as ymaps.GeoObject;
          const bounds = target.geometry?.getBounds();
          if (!bounds) return;
          entry.location = target.properties.get('name', '' as any) as any;
          entry.geoloc = bounds[0] as GeoLocation;
          target.options.set('preset', 'islands#redDotIcon');
        });

        // Выбранный результат помещаем в коллекцию.
        searchControl.events.add('resultselect', async e => {
          const index = e.get('index') as any;
          const res = await searchControl.getResult(index) as any;
          searchResults.add(res);
        });

        searchControl.events.add('submit', () => searchResults.removeAll())
      }
    })

    return {
      entry,
      image,
      statusOptions,
      save,
      uploader,
      imageDelete,
      imageMove,
      fileUploadCount,
      activeImageIndex,
      generateSlug,
      mapElement,
    };
  },
  components: {
    ProductStatus,
    Dropdown,
    Editor,
    Galleria,
    FileUpload,
    Toolbar,
    InputText,
    InputNumber,
    Button,
    Divider,
  },
});
</script>

<style lang="scss" scoped>
.image-full {
  .panel {
    display: block;
    width: 100%;
  }
  img {
    display: block;
    width: 100%;
  }
}
</style>

<style lang="scss">
.p-galleria-thumbnail-items-container {
  width: 100%;
}
</style>
