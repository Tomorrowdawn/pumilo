import type { FC } from "react";
import { TEXT } from "../index";

const HelloTemplate: FC = () => (
  <main className="hello-shell">
    <div className="hello-card">
      <p className="hello-text">
        Hello <TEXT id="content" placeholder="World" className="hello-input" publishAs="span" />
      </p>
      <p className="hello-subtitle">Customize the content and click save.</p>
    </div>
  </main>
);

export default HelloTemplate;

