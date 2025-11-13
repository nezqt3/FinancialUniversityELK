import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  fetchAccountRequest,
  loginAccountRequest,
  registerAccountRequest,
} from "../methods/account/api";
import {
  getScheduleStorageKey,
  persistScheduleProfile,
} from "../methods/schedule/scheduleUtils";

const STORAGE_KEY = "max-miniapp:account-id";

const AccountContext = createContext({
  account: null,
  isInitializing: true,
  isProcessing: false,
  error: "",
  registerAccount: async () => {},
  loginAccount: async () => {},
  logout: () => {},
  refreshAccount: async () => {},
});

export const AccountProvider = ({ children }) => {
  const [accountId, setAccountId] = useState(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return window.localStorage.getItem(STORAGE_KEY);
  });
  const [account, setAccount] = useState(null);
  const [isInitializing, setIsInitializing] = useState(Boolean(accountId));
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const persistAccountId = useCallback((value) => {
    if (typeof window === "undefined") {
      return;
    }
    if (value) {
      window.localStorage.setItem(STORAGE_KEY, value);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const updateAccountId = useCallback(
    (nextId) => {
      setAccountId(nextId);
      persistAccountId(nextId);
    },
    [persistAccountId],
  );

  const syncScheduleFromAccount = useCallback(
    (payload) => {
      if (typeof window === "undefined") {
        return;
      }
      if (!payload?.universityId) {
        return;
      }
      const storageKey = getScheduleStorageKey(payload.universityId);
      if (!storageKey) {
        return;
      }
      if (payload.scheduleProfile) {
        persistScheduleProfile(storageKey, payload.scheduleProfile);
      }
    },
    [],
  );

  const loadAccount = useCallback(
    async (targetId) => {
      if (!targetId) {
        setAccount(null);
        setIsInitializing(false);
        return null;
      }
      setIsInitializing(true);
      try {
        const data = await fetchAccountRequest(targetId);
        setAccount(data);
        syncScheduleFromAccount(data);
        return data;
      } catch (fetchError) {
        console.error("Failed to load account", fetchError);
        setAccount(null);
        updateAccountId(null);
        return null;
      } finally {
        setIsInitializing(false);
      }
    },
    [syncScheduleFromAccount, updateAccountId],
  );

  useEffect(() => {
    loadAccount(accountId);
  }, [accountId, loadAccount]);

  const handleSuccess = useCallback(
    (payload) => {
      setAccount(payload);
      updateAccountId(payload?.id ?? null);
      syncScheduleFromAccount(payload);
      setError("");
      return payload;
    },
    [syncScheduleFromAccount, updateAccountId],
  );

  const registerAccount = useCallback(
    async (form) => {
      setIsProcessing(true);
      setError("");
      try {
        const result = await registerAccountRequest(form);
        return handleSuccess(result);
      } catch (registerError) {
        const message =
          registerError?.message || "Не удалось создать аккаунт";
        setError(message);
        throw registerError;
      } finally {
        setIsProcessing(false);
      }
    },
    [handleSuccess],
  );

  const loginAccount = useCallback(
    async (payload) => {
      setIsProcessing(true);
      setError("");
      try {
        const result = await loginAccountRequest(payload);
        return handleSuccess(result);
      } catch (loginError) {
        const message =
          loginError?.message || "Не удалось авторизоваться";
        setError(message);
        throw loginError;
      } finally {
        setIsProcessing(false);
      }
    },
    [handleSuccess],
  );

  const logout = useCallback(() => {
    setAccount(null);
    updateAccountId(null);
  }, [updateAccountId]);

  const refreshAccount = useCallback(() => {
    if (!accountId) {
      return Promise.resolve(null);
    }
    return loadAccount(accountId);
  }, [accountId, loadAccount]);

  const value = useMemo(
    () => ({
      account,
      isInitializing,
      isProcessing,
      error,
      registerAccount,
      loginAccount,
      logout,
      refreshAccount,
    }),
    [
      account,
      error,
      isProcessing,
      isInitializing,
      loginAccount,
      logout,
      registerAccount,
      refreshAccount,
    ],
  );

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  );
};

export const useAccount = () => useContext(AccountContext);
