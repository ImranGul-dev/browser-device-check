import { siteConfig } from '@/config/site';

export type SchemaNode = Record<string, unknown>;

export function absoluteUrl(path: string): string {
  return new URL(path, siteConfig.origin).toString();
}

export function publisherSchema(): SchemaNode {
  return {
    '@type': siteConfig.publisherType,
    '@id': `${siteConfig.origin.replace(/\/$/, '')}/#publisher`,
    name: siteConfig.publisherName,
    url: siteConfig.origin,
    email: siteConfig.supportEmail,
  };
}

export function breadcrumbSchema(
  items: { name: string; path: string }[],
  idPath: string,
): SchemaNode {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${absoluteUrl(idPath)}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildHomeSchema(description: string): SchemaNode {
  const url = absoluteUrl('/');
  return {
    '@context': 'https://schema.org',
    '@graph': [
      publisherSchema(),
      {
        '@type': 'WebSite',
        '@id': `${url}#website`,
        name: siteConfig.name,
        url,
        description,
        publisher: { '@id': `${url}#publisher` },
        inLanguage: 'en-US',
      },
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        name: `Online Device Tests for Camera, Mic, Speakers and More | ${siteConfig.name}`,
        url,
        description,
        isPartOf: { '@id': `${url}#website` },
        about: { '@id': `${url}#publisher` },
        inLanguage: 'en-US',
      },
    ],
  };
}

export function buildToolSchema(input: {
  name: string;
  path: string;
  description: string;
  featureList?: string[];
}): SchemaNode {
  const url = absoluteUrl(input.path);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        name: input.name,
        url,
        description: input.description,
        breadcrumb: { '@id': `${url}#breadcrumb` },
        mainEntity: { '@id': `${url}#application` },
        inLanguage: 'en-US',
      },
      {
        '@type': 'WebApplication',
        '@id': `${url}#application`,
        name: input.name,
        url,
        description: input.description,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Any operating system with a supported web browser',
        browserRequirements: 'Requires JavaScript and a supported browser.',
        isAccessibleForFree: true,
        ...(input.featureList?.length ? { featureList: input.featureList } : {}),
      },
      breadcrumbSchema(
        [
          { name: 'Home', path: '/' },
          { name: input.name, path: input.path },
        ],
        input.path,
      ),
    ],
  };
}

export function buildGuideSchema(input: {
  title: string;
  description: string;
  path: string;
  published: Date;
  updated: Date;
}): SchemaNode {
  const url = absoluteUrl(input.path);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      publisherSchema(),
      {
        '@type': 'TechArticle',
        '@id': `${url}#article`,
        headline: input.title,
        url,
        description: input.description,
        datePublished: input.published.toISOString(),
        dateModified: input.updated.toISOString(),
        mainEntityOfPage: { '@id': `${url}#webpage` },
        author: { '@id': `${siteConfig.origin.replace(/\/$/, '')}/#publisher` },
        publisher: { '@id': `${siteConfig.origin.replace(/\/$/, '')}/#publisher` },
        inLanguage: 'en-US',
      },
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        name: input.title,
        url,
        description: input.description,
        breadcrumb: { '@id': `${url}#breadcrumb` },
        mainEntity: { '@id': `${url}#article` },
        inLanguage: 'en-US',
      },
      breadcrumbSchema(
        [
          { name: 'Home', path: '/' },
          { name: 'Guides', path: '/guides/' },
          { name: input.title, path: input.path },
        ],
        input.path,
      ),
    ],
  };
}

export function buildSimplePageSchema(input: {
  type: 'AboutPage' | 'ContactPage' | 'WebPage' | 'CollectionPage';
  name: string;
  path: string;
  description: string;
  includePublisher?: boolean;
}): SchemaNode {
  const url = absoluteUrl(input.path);
  const graph: SchemaNode[] = [];
  if (input.includePublisher) graph.push(publisherSchema());
  graph.push(
    {
      '@type': input.type,
      '@id': `${url}#webpage`,
      name: input.name,
      url,
      description: input.description,
      breadcrumb: { '@id': `${url}#breadcrumb` },
      ...(input.includePublisher
        ? { about: { '@id': `${siteConfig.origin.replace(/\/$/, '')}/#publisher` } }
        : {}),
      inLanguage: 'en-US',
    },
    breadcrumbSchema(
      [
        { name: 'Home', path: '/' },
        { name: input.name, path: input.path },
      ],
      input.path,
    ),
  );
  return { '@context': 'https://schema.org', '@graph': graph };
}

export function buildGuidesHubSchema(
  description: string,
  guides: { title: string; path: string }[],
): SchemaNode {
  const url = absoluteUrl('/guides/');
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${url}#webpage`,
        name: 'Device Testing Guides',
        url,
        description,
        breadcrumb: { '@id': `${url}#breadcrumb` },
        mainEntity: { '@id': `${url}#items` },
        inLanguage: 'en-US',
      },
      {
        '@type': 'ItemList',
        '@id': `${url}#items`,
        name: 'Published device testing guides',
        numberOfItems: guides.length,
        itemListElement: guides.map((guide, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: guide.title,
          url: absoluteUrl(guide.path),
        })),
      },
      breadcrumbSchema(
        [
          { name: 'Home', path: '/' },
          { name: 'Guides', path: '/guides/' },
        ],
        '/guides/',
      ),
    ],
  };
}
