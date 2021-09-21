<template>
<div v-if="list.length > 0" class="card">
  <DataView :value="list" layout="list" :paginator="true" :rows="9">
    <template #list="{data}">
      <div class="p-col-12">
        <div class="product-list-item">
          <router-link :to="`/events/${getProduct(data.entry.product_id)?.slug}`">
            <img :src="format.imageUrl(getProduct(data.entry.product_id)?.images[0] || '', 300, 300)" />
          </router-link>
          <div class="product-list-detail">
            <router-link :to="`/events/${getProduct(data.entry.product_id)?.slug}`">
              <button class="p-link product-name">{{getProduct(data.entry.product_id)?.title}}</button>
            </router-link>
            <div class="product-description">{{getProduct(data.entry.product_id)?.start_time}}</div>
            <i class="pi pi-tag product-category-icon"></i><span class="product-category">{{getProduct(data.entry.product_id)?.category}}</span>
          </div>
          <div class="product-list-action">
            <button v-if="Status.active === data.entry.status" class="p-link p-mb-2" @click="downloadPdf(data.id, data.entry)" style="font-size: 1.2em;"><i class="pi pi-file-pdf p-d-inline p-mr-2"></i>Распечатать</button>
            <span class="product-price">{{format.currency(data.entry.price)}}</span>
            <TicketStatus :value="data.entry.status" />
          </div>
        </div>
      </div>
    </template>
  </DataView>
</div>
<div v-else>У вас ещё нет купленных билетов</div>
</template>

<script lang="ts">
import { defineComponent, reactive, onUnmounted } from "vue";
import user from '../modules/user';
import ticket, { Entry, Status } from '../modules/ticket';
import product from '../modules/product';
import DataView from 'primevue/dataview';
import format from '../modules/format';
import TicketStatus from '../components/TicketStatus.vue';
import qrcode from 'qrcode';
import { jsPDF } from 'jspdf';
import logo from '../assets/logo.png';
import font from '../assets/PTSans.ttf';

export default defineComponent({
  async setup() {
    let stopWatchStatus: () => void = () => {};
    let stopWatchDeleted: () => void = () => {};
    let stopWatchCreated: () => void = () => {};

    onUnmounted(() => {
      stopWatchStatus();
      stopWatchDeleted();
      stopWatchCreated();
    });

    const { phone } = await user.me();
    const list = reactive(await ticket.my());
    const products = await product.findAll();

    const getProduct = (id: number) => {
      return products.find(item => item.id === id)?.entry;
    }

    stopWatchStatus = ticket.watchStatus(phone, ({id, status}) => {
      const t = list.find(item => item.id === id);
      if (t) {
        t.entry.status = status;
      }
    })

    stopWatchDeleted = ticket.watchDeleted(phone, ({id}) => {
      const index = list.findIndex(item => item.id === id);

      if (index > -1) {
        list.splice(index, 1)
      }
    })

    stopWatchCreated = ticket.watchCreated(phone, ({id, entry}) => {
      list.unshift({id, entry});
    })


    const downloadPdf = async (id: number, entry: Entry) => {
      const product = getProduct(entry.product_id);
      if (!product) return;

      const qrData = {
        id,
        user: phone,
        product: product.title,
      };

      const [lat, lon] = product.geoloc;
      const map = `https://static-maps.yandex.ru/1.x/?ll=${lon},${lat}&size=650,450&z=15&l=map&pt=${lon},${lat},pm2rdm`;
      const qr = await qrcode.toDataURL(JSON.stringify(qrData));

      const doc = new jsPDF({
        unit: 'pt',
      });

      doc.addFont(font, "PTSans", "normal");

      doc.setFont("PTSans");

      doc.addImage(logo, "png", 10, 10, 150, 80);
      doc.addImage(qr, "png", 445, 0, 150, 150);

      doc.setFontSize(25);
      doc.text("Входной билет", 20, 130);

      doc.addImage(qr, "png", 445, 0, 150, 150);

      doc.setFontSize(20);
      doc.text(product.title, 20, 180);

      doc.setFontSize(15);
      doc.text(`Начало: ${product.start_time}`, 20, 210);
      doc.text(`Локация: ${product.location}`, 20, 233);

      doc.addImage(map, "png", 20, 250, 560, 394);

      doc.save(`ticket-${id}.pdf`);
    }

    return {
      list,
      format,
      getProduct,
      downloadPdf,
      Status,
    }
  },
  components: {
    DataView,
    TicketStatus,
  }
})
</script>

<style lang="scss" scoped>

.card {
    background: #ffffff;
    padding: 2rem;
    box-shadow: 0 2px 1px -1px rgba(0,0,0,.2), 0 1px 1px 0 rgba(0,0,0,.14), 0 1px 3px 0 rgba(0,0,0,.12);
    border-radius: 4px;
    margin-bottom: 2rem;
}
.product-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: #495057;
}

.product-description {
  margin: 0 0 1rem 0;
}

.product-category-icon {
  vertical-align: middle;
  margin-right: .5rem;
}

.product-category {
  font-weight: 600;
  vertical-align: middle;
}

::v-deep(.product-list-item) {
  display: flex;
  align-items: center;
  padding: 1rem;
  width: 100%;

  img {
    width: 10em;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
    margin-right: 2rem;
  }

  .product-list-detail {
    flex: 1 1 0;
  }

  .product-price {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: .5rem;
    align-self: flex-end;
  }

  .product-list-action {
    display: flex;
    flex-direction: column;
  }

}

@media screen and (max-width: 576px) {
  .product-list-item {
    flex-direction: column;
    align-items: center;

    img {
      margin: 2rem 0;
    }

    .product-list-detail {
      text-align: center;
    }

    .product-price {
      align-self: center;
    }

    .product-list-action {
      display: flex;
      flex-direction: column;
    }

    .product-list-action {
      margin-top: 2rem;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
  }
}
</style>
