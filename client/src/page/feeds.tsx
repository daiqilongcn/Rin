import { useContext, useEffect, useRef, useState } from "react"
import { Helmet } from 'react-helmet'
import { Link, useSearch } from "wouter"
import { FeedCard } from "../components/feed_card"
import { Waiting } from "../components/loading"
import { client } from "../app/runtime"
import { ProfileContext } from "../state/profile"

import { useSiteConfig } from "../hooks/useSiteConfig";
import { siteName } from "../utils/constants"
import { tryInt } from "../utils/int"
import { useTranslation } from "react-i18next";

type FeedsData = {
    size: number,
    data: any[],
    hasNext: boolean
}

type FeedType = 'draft' | 'unlisted' | 'normal'

type FeedsMap = {
    [key in FeedType]: FeedsData
}

export function FeedsPage() {
    const { t } = useTranslation()
    const siteConfig = useSiteConfig();
    const query = new URLSearchParams(useSearch());
    const profile = useContext(ProfileContext);
    const [listState, _setListState] = useState<FeedType>(query.get("type") as FeedType || 'normal')
    const [status, setStatus] = useState<'loading' | 'idle'>('idle')
    const [feeds, setFeeds] = useState<FeedsMap>({
        draft: { size: 0, data: [], hasNext: false },
        unlisted: { size: 0, data: [], hasNext: false },
        normal: { size: 0, data: [], hasNext: false }
    })
    const page = tryInt(1, query.get("page"))
    const limit = tryInt(siteConfig.pageSize, query.get("limit"))
    const feedListClass = siteConfig.feedLayout === "masonry" ? "wauto columns-1 gap-5 ani-show md:columns-2" : "wauto flex flex-col ani-show";
    const currentFeeds = feeds[listState] ?? { size: 0, data: [], hasNext: false };
    const currentFeedData = Array.isArray(currentFeeds.data) ? currentFeeds.data : [];
    const featuredFeed = listState === 'normal' && page === 1 ? currentFeedData.find(feed => feed.top > 0) : undefined;
    const remainingFeeds = currentFeedData.filter(feed => feed !== featuredFeed);
    const ref = useRef("")
    function fetchFeeds(type: FeedType) {
        client.feed.list({
            page: page,
            limit: limit,
            type: type
        }).then(({ data }) => {
            if (data) {
                setFeeds({
                    ...feeds,
                    [type]: data
                })
                setStatus('idle')
            }
        })
    }
    useEffect(() => {
        const key = `${query.get("page")} ${query.get("type")} ${limit}`
        if (ref.current == key) return
        const type = query.get("type") as FeedType || 'normal'
        if (type !== listState) {
            _setListState(type)
        }
        setStatus('loading')
        fetchFeeds(type)
        ref.current = key
    }, [limit, query.get("page"), query.get("type")])
    return (
        <>
            <Helmet>
                <title>{`${t('article.title')} - ${siteConfig.name}`}</title>
                <meta property="og:site_name" content={siteName} />
                <meta property="og:title" content={t('article.title')} />
                <meta property="og:image" content={siteConfig.avatar} />
                <meta property="og:type" content="article" />
                <meta property="og:url" content={document.URL} />
            </Helmet>
            <Waiting for={feeds.draft.size + feeds.normal.size + feeds.unlisted.size > 0 || status === 'idle'}>
                <main className="library-home w-full flex flex-col justify-center items-center mb-8">
                    {listState === 'normal' && page === 1 && (
                        <section className="wauto library-intro">
                            <p className="library-eyebrow">{siteConfig.name} / {t('library.collection')}</p>
                            <h1>{t('library.intro')}</h1>
                            <p className="library-intro-description">{siteConfig.description || t('library.description')}</p>
                            <a href="#library-entries" className="library-intro-link">{t('library.explore')} <span aria-hidden="true">↓</span></a>
                            <span className="library-intro-mark" aria-hidden="true">R</span>
                        </section>
                    )}
                    {featuredFeed && status === 'idle' && (
                        <section className="wauto library-featured" aria-label={t('library.featured')}>
                            <FeedCard {...featuredFeed} literary featured />
                        </section>
                    )}
                    <div id="library-entries" className="wauto library-section-heading">
                        <h2>
                            {listState === 'draft' ? t('draft_bin') : listState === 'normal' ? t('library.works') : t('unlisted')}
                        </h2>
                        <div className="flex flex-row justify-between">
                            <p className="text-sm mt-4 text-neutral-500 font-normal">
                                {t('article.total$count', { count: currentFeeds.size })}
                            </p>
                            {profile?.permission &&
                                <div className="flex flex-row space-x-4">
                                    <Link href={listState === 'draft' ? '/?type=normal' : '/?type=draft'} className={`text-sm mt-4 text-neutral-500 font-normal ${listState === 'draft' ? "text-theme" : ""}`}>
                                        {t('draft_bin')}
                                    </Link>
                                    <Link href={listState === 'unlisted' ? '/?type=normal' : '/?type=unlisted'} className={`text-sm mt-4 text-neutral-500 font-normal ${listState === 'unlisted' ? "text-theme" : ""}`}>
                                        {t('unlisted')}
                                    </Link>
                                </div>
                            }
                        </div>
                    </div>
                    <Waiting for={status === 'idle'}>
                        <div className={`${feedListClass} library-entries ${siteConfig.feedLayout === 'masonry' ? 'library-entries--masonry' : ''}`}>
                            {remainingFeeds.map(({ id, ...feed }: any) => (
                                <FeedCard key={id} id={id} {...feed} literary />
                            ))}
                            {currentFeedData.length === 0 && <p className="library-empty">{t('library.empty')}</p>}
                        </div>
                        <div className="wauto flex flex-row items-center mt-4 ani-show">
                            {page > 1 &&
                                <Link href={`/?type=${listState}&page=${(page - 1)}`}
                                    className="library-page-link text-sm px-4 py-2">
                                    {t('previous')}
                                </Link>
                            }
                            <div className="flex-1" />
                            {currentFeeds.hasNext &&
                                <Link href={`/?type=${listState}&page=${(page + 1)}`}
                                    className="library-page-link text-sm px-4 py-2">
                                    {t('next')}
                                </Link>
                            }
                        </div>
                    </Waiting>
                </main>
            </Waiting>
        </>
    )
}
