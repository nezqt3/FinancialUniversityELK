import { useEffect, useMemo } from 'react';
import { Panel, Grid, Container, Flex, Avatar, Typography } from '@maxhub/max-ui';

const DEFAULT_AVATAR = 'https://sun9-21.userapi.com/1N-rJz6-7hoTDW7MhpWe19e_R_TdGV6Wu5ZC0A/67o6-apnAks.jpg';

const isObject = (value) => typeof value === 'object' && value !== null;

const decodeStartParam = (raw) => {
    if (!raw || typeof window === 'undefined') {
        return null;
    }

    try {
        const normalized = raw.replace(/-/g, '+').replace(/_/g, '/');
        const withPadding = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
        const decoded = window.atob(withPadding);
        return JSON.parse(decoded);
    } catch (error) {
        console.warn('[miniapp] Failed to decode start param', error);
        return raw;
    }
};

const useMiniAppMeta = () => useMemo(() => {
    if (typeof window === 'undefined') {
        return {
            userName: 'Гость',
            avatar: DEFAULT_AVATAR,
            userId: null,
            startParam: null,
            rawStartParam: null,
            version: null,
        };
    }

    const initData = window.WebApp?.initDataUnsafe;
    const user = initData?.user;
    const startParamRaw = initData?.start_param
        || new URLSearchParams(window.location.search).get('WebAppStartParam')
        || null;

    const startParam = decodeStartParam(startParamRaw);
    const nameFromProfile = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim();
    const fallbackName = isObject(startParam)
        ? [startParam.firstName, startParam.lastName].filter(Boolean).join(' ').trim()
        : '';

    return {
        userName: nameFromProfile || fallbackName || 'Гость',
        avatar: user?.photo_url || DEFAULT_AVATAR,
        userId: user?.user_id ?? null,
        startParam,
        rawStartParam: startParamRaw,
        version: window.WebApp?.version ?? null,
    };
}, []);

const App = () => {
    const meta = useMiniAppMeta();

    useEffect(() => {
        window.WebApp?.ready?.();
    }, []);

    const startParamPreview = meta.startParam
        ? typeof meta.startParam === 'string'
            ? meta.startParam
            : JSON.stringify(meta.startParam, null, 2)
        : 'нет данных';

    return (
        <Panel mode="secondary" className="panel">
            <Grid gap={12} cols={1}>
                <Container className="me">
                    <Flex direction="column" align="center" gap={12}>
                        <Avatar.Container size={72} form="squircle" className="me__avatar">
                            <Avatar.Image src={meta.avatar} alt="Аватар пользователя" />
                        </Avatar.Container>

                        <Typography.Title>{meta.userName}</Typography.Title>
                        <Typography.Subtitle color="tertiary">
                            ID пользователя: {meta.userId ?? 'недоступно'}
                        </Typography.Subtitle>
                        {meta.version && (
                            <Typography.Caption color="tertiary">
                                Клиент MAX {meta.version}
                            </Typography.Caption>
                        )}
                    </Flex>
                </Container>
                <Container>
                    <Typography.Title level={4}>Параметры запуска</Typography.Title>
                    <Typography.Subtitle color="tertiary">
                        Переданы через startapp: {meta.rawStartParam || '—'}
                    </Typography.Subtitle>
                    <pre
                        style={{
                            width: '100%',
                            marginTop: 12,
                            padding: 12,
                            borderRadius: 16,
                            background: 'rgba(255,255,255,0.04)',
                            fontSize: 14,
                            overflowX: 'auto',
                        }}
                    >
                        {startParamPreview}
                    </pre>
                </Container>
            </Grid>
        </Panel>
    );
};

export default App;
