// import { UserRef } from './user';
import { firestore } from 'firebase/app';

export enum GoodsCategory {
  undefined = '',
  appliances = 'appliances',  // 가전제품, 디지털
  household = 'household',    // 생활용품
  beauty = 'beauty',          // 뷰티
  home = 'home',              // 홈데코
  women = 'women',            // 여성의류
  man = 'man',                // 남성의류
  fashion = 'fashion',        // 패션잡화
  luxury = 'luxury',          // 명품, 주얼리
  kids = 'kids'               // 유아, 출산
}

export enum GoodsPurchaseTime {
  undefined = '',
  unknown = 'unknown',        // 알 수 없음
  week = 'week',              // 일주일 이내
  month = 'month',            // 한 달 이내
  threeMonth = 'threeMonth',  // 석 달 이내
  year = 'year',              // 일 년 이내
  longAgo = 'longAgo'         // 오래전
}

export enum GoodsCondition {
  undefined = '',
  boxed = 'boxed',            // 미개봉
  almostNew = 'almostNew',    // 거의 새상품
  used = 'used'               // 사용감 있음
}

export enum GoodsDelivery {
  undefined = '',
  directly = 'directly',      // 직거래
  courier = 'courier',        // 택배
  etc = 'etc'                 // 기타 다른 방법
}

export interface Goods {
  id: string;
  // user: UserRef;
  title: string;
  public: boolean;
  category: GoodsCategory;
  purchaseTime: GoodsPurchaseTime;
  condition: GoodsCondition;
  price: number;
  delivery: GoodsDelivery;
  deliveryEtc: string;
  images: string[]; // url
  contact: string;
  favoritesCnt: number;
  commentCnt: number;
  created: firestore.Timestamp;
  updated: firestore.Timestamp;
}

export type NewGoods = Omit<Goods, 'id' | 'created' | 'updated'> & {
  created: firestore.FieldValue,
  updated: firestore.FieldValue
};

export type GoodsRef = firestore.DocumentReference;