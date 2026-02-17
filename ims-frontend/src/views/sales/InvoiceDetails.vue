<div class="actions">
  <button v-if="invoice.status !== 'paid'" @click="pay">
    💵 Pay 1000
  </button>

  <button v-if="invoice.status === 'issued'" @click="store.processReturn(invoice.id)">
    🔁 Process Return
  </button>

  <button v-if="invoice.status === 'draft'" @click="store.issueInvoice(invoice.id)">
    📤 Issue Invoice
  </button>
</div>
