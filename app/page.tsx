import Image from "next/image";
import styles from './page.module.scss'
import Nav from "@/app/Component/Home/Nav";
import Background from "@/app/Component/Home/Background";

export default function Home() {
  return (
    <div>
      <Nav />
      <Background />
    </div>
  );
}
