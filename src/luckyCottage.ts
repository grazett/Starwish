export const luckyAssets={background:'/assets/level-four/lucky-cottage-wide.webp',originalBackground:'/assets/level-four/lucky-cottage.webp',cabinet:'/assets/level-four/cabinet-closeup.webp',npc:'/assets/level-four/shopkeeper.webp',giftClosed:'/assets/level-four/gift-closed.webp',giftOpen:'/assets/level-four/gift-open.webp',headpiece:'/assets/level-four/pig-hat.webp'};
export const luckyGreeting='欢迎光临幸运小屋！\n这里的每一个盒子，都藏着一份小惊喜。';
export const luckyBirthdayGreeting='祝你生日快乐，亲手打开这些盒子吧！';
// Keep reward IDs stable so existing assignments, claims and third-draw saves survive.
export const luckyRewards=[
 {id:'letter',kind:'note',name:'一封来信',image:'/assets/level-four/rewards/letter.svg',description:'你终于来到这里了！怎么样，玩的开心吗，你以为要结束了吗？nonono，你马上就要拿到神秘大奖啦，期待一下吧！'},
 {id:'pig-card',kind:'card',name:'小猪认证卡',image:'/assets/level-four/rewards/pig-card.svg',description:''},
 {id:'voucher',kind:'photo',name:'你和五月七',image:'/assets/level-four/rewards/photo-1.webp',description:'在牛局的美照。'},
 {id:'fortune',kind:'note',name:'今日幸运签',image:'/assets/level-four/rewards/fortune.svg',description:'生日上上签，今后的日子每天都是开心幸福。'},
 {id:'wish',kind:'item',name:'一只小狗',image:'/assets/level-four/rewards/puppy.svg',description:'只是一只小狗'},
 {id:'potato',kind:'item',name:'神秘土豆',image:'/assets/level-four/rewards/potato.svg',description:'没什么，这只是一个土豆'},
 {id:'memory',kind:'photo',name:'你和李阿呆',image:'/assets/level-four/rewards/photo-2.webp',description:'这是一张古老的照片.....。'},
 {id:'bestie',kind:'visitor',name:'神秘人物·暖暖',image:'/assets/level-four/rewards/nuannuan.webp',description:'亲爱的{nickname}，祝你生日快乐，以后我们也一起快乐玩耍吧！'},
 {id:'headpiece',kind:'item',name:'小猪头饰',image:'/assets/level-four/pig-hat.webp',description:''},
] as const;
export type LuckyRewardId=typeof luckyRewards[number]['id'];
export const luckyRewardIds=luckyRewards.map(item=>item.id);
export const isLuckyReward=(value:unknown):value is LuckyRewardId=>luckyRewardIds.includes(value as LuckyRewardId);
// Centers share the closeup's image coordinates, just above the shelf floors.
export const luckyBoxSlots=[30,50,70].flatMap(y=>[33,50,67].map(x=>({x,y})));
export const luckyOverviewSlots=[36.5,50,63.5].flatMap(y=>[39.5,50,60.5].map(x=>({x,y})));
