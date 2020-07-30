import { last } from 'lodash-es';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { first, map, scan, shareReplay, switchMap, tap } from 'rxjs/operators';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, GoodsService } from '@app/core/http';
import { GoodsCacheService, PersistenceService } from '@app/core/persistence';
import { Goods } from '@app/core/model';

@Component({
  selector: 'app-goods-list',
  templateUrl: './goods-list.component.html',
  styleUrls: ['./goods-list.component.scss']
})
export class GoodsListComponent implements OnInit, OnDestroy {
  private fetchingMoreGoods = false;
  moreGoods$ = new BehaviorSubject<Goods[]>([]);
  goods$ =
    combineLatest([
      this.persistenceService.goods$.pipe(first()),
      this.moreGoods$.pipe(scan((a, c) => a.concat(c), []))
    ]).pipe(
      map(([goods, moreGoods]) => goods.concat(moreGoods)),
      shareReplay(1)
    );

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private authService: AuthService,
    private goodsService: GoodsService,
    private goodsCacheService: GoodsCacheService,
    private persistenceService: PersistenceService
  ) { }

  ngOnInit(): void {
  }

  ngOnDestroy() {
    this.moreGoods$.unsubscribe();
  }

  trackBy(index, item) {
    return item.id;
  }

  onMoreGoods() {
    if (this.fetchingMoreGoods || this.moreGoods$.closed) {
      return;
    }
    this.fetchingMoreGoods = true;
    combineLatest([
      this.goods$.pipe(first()),
      this.authService.profile$.pipe(first())
    ]).pipe(
      switchMap(([goods, profile]) => {
        return this.goodsService.getQueryByGroupId(profile.groupId, {
          startAfter: last(goods).updated,
          limit: 5
        });
      })
    ).subscribe(moreGoods => {
      if (moreGoods.length > 0) {
        this.moreGoods$.next(moreGoods);
      } else {
        this.moreGoods$.unsubscribe();
      }
      this.fetchingMoreGoods = false;
    });
  }

}
