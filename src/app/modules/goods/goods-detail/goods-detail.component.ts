import { combineLatest, forkJoin, Observable, of } from 'rxjs';
import { filter, first, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, GoodsService, GoodsFavoritesService, GroupsService, ProfilesService } from '@app/core/http';
import { Goods, NewGoodsFavorite } from '@app/core/model';

@Component({
  selector: 'app-goods-detail',
  templateUrl: './goods-detail.component.html',
  styleUrls: ['./goods-detail.component.scss']
})
export class GoodsDetailComponent implements OnInit {
  goods$: Observable<Goods> = this.goodsService.valueChanges(this.goodsId).pipe(shareReplay(1));
  empty$: Observable<boolean> = this.goods$.pipe(map(g => !g));
  permission$: Observable<boolean> = combineLatest([
    this.goods$,
    this.authService.profile$.pipe(first(), filter(p => !!p))
  ]).pipe(
    map(([g, p]) => g.profileId === p.id),
    shareReplay(1)
  );
  favoriteCount$: Observable<number> = this.goods$.pipe(
    map(goods => goods.favoritesCnt)
  );
  favorited$: Observable<boolean> = combineLatest([
    this.goods$,
    this.authService.profile$
  ]).pipe(
    switchMap(([g, p]) => this.goodsFavoritesService.getQueryByGoodsIdAndProfileId(g.id, p.id)),
    map(f => f.length > 0),
    shareReplay(1)
  );

  private get groupId() {
    return this.activatedRoute.snapshot.paramMap.get('groupId');
  }

  private get goodsId() {
    return this.activatedRoute.snapshot.paramMap.get('goodsId');
  }

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private authService: AuthService,
    private groupService: GroupsService,
    private profilesService: ProfilesService,
    private goodsService: GoodsService,
    private goodsFavoritesService: GoodsFavoritesService
  ) {
  }

  ngOnInit(): void {
  }

  onClickSoldOut() {
    const goodsId = this.goodsId;
    this.goodsService.get(goodsId).pipe(
      first(),
      filter(g => !!g),
      map(g => !!g.soldOut),
      switchMap(soldOut => this.goodsService.updateSoldOut(goodsId, !soldOut))
    ).subscribe(
      () => {},
      err => alert(err)
    );
  }

  onClickFavorite() {
    const goodsId = this.goodsId;
    const addGoodsFavorite$ = forkJoin([
      this.authService.user$.pipe(first(), filter(u => !!u)),
      this.authService.profile$.pipe(first(), filter(p => !!p))
    ]).pipe(
      switchMap(([u, p]) => {
        return this.goodsFavoritesService.add({
          userId: u.id,
          profileId: p.id,
          goodsId,
          created: GoodsFavoritesService.serverTimestamp()
        } as NewGoodsFavorite);
      })
    );
    const deleteGoodsFavorite$ = forkJoin([
      this.authService.profile$.pipe(first(), filter(p => !!p))
    ]).pipe(
      switchMap(([p]) => this.goodsFavoritesService.deleteByGoodsIdAndProfileId(goodsId, p.id))
    );
    forkJoin([
      this.favorited$.pipe(first()),
      this.favoriteCount$.pipe(first()),
      this.permission$.pipe(first())
    ]).pipe(
      switchMap(([favorited, favoriteCount, permission]) => {
        if (permission) {
          return of(null);
        } else {
          this.favorited$ = of(!favorited);
          this.favoriteCount$ = of(favoriteCount + (favorited ? -1 : 1));
          return favorited ? deleteGoodsFavorite$ : addGoodsFavorite$;
        }
      })
    ).subscribe(
      () => {},
      err => alert(err)
    );
  }

  onClickDelete() {
    if (confirm('삭제 할까요?')) {
      const goodsId = this.activatedRoute.snapshot.paramMap.get('goodsId');
      this.goodsService.update(goodsId, {activated: false}).then(
        () => this.router.navigate(['goods']),
        (err) => alert(err)
      );
    }
  }

}
