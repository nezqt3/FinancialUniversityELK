import LogoFin from "../static/logoFin.svg";
import LogoRgeu from "../static/logoRgeu.png";

export const UNIVERSITIES = [
  {
    id: "financial-university",
    apiId: "financial-university",
    title: "Финансовый университет при Правительстве РФ",
    shortTitle: "Финуниверситет",
    domain: "fa.ru",
    brandColor: "#6366f1",
    logo: LogoFin,
    services: {
      deanOffice: {
        paymentOptions: [
          {
            id: "edu",
            title: "Оплата обучения",
            caption: "Контрактное обучение, пересдачи, доп. услуги",
            url: "https://pay.fa.ru/moscow/edu/",
          },
        ],
      },
    },
  },
  {
    id: "rgeu-university",
    apiId: "rgeu-university",
    title: "Ростовский государственный экономический университет (РИНХ)",
    shortTitle: "РГЭУ (РИНХ)",
    domain: "https://rsue.ru",
    brandColor: "#0e1060",
    logo: LogoRgeu,
    services: {},
  },
];

export const UNIVERSITY_MAP = UNIVERSITIES.reduce((acc, university) => {
  acc[university.id] = university;
  return acc;
}, {});

export const DEFAULT_UNIVERSITY_ID = UNIVERSITIES[0]?.id ?? null;
