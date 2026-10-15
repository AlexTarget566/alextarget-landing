import "./style.css";
import { captureUtm } from "./utils/utm";
import { initHero } from "./sections/hero";
import { initServices } from "./sections/services";
import { initCases } from "./sections/cases";
import { initLeadForm } from "./sections/leadForm";
import { initContact } from "./sections/contact";

captureUtm();
initHero();
initServices();
initCases();
initLeadForm();
initContact();
