import ServiceFeatureStub from "./ServiceFeatureStub";
import ServicePaymentCard from "./ServicePaymentCard";

const PAYMENT_OPTIONS = [
  {
    id: "residence",
    title: "Проживание и коммунальные услуги",
    caption: "Регулярные начисления, штрафы и услуги общежития",
    url: "https://pay.fa.ru/moscow/other/",
  },
];


const DormService = () => (
  <div className="service-detail-grid">
    <div className="service-detail-grid__column service-detail-grid__column--primary">
      <ServicePaymentCard
        title="Оплата проживания в общежитии"
        description="Оплата попадает в официальный сервис, но форма остается внутри мини-приложения."
        options={PAYMENT_OPTIONS}
      />
    </div>
  </div>
);

export default DormService;
