
'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef, ReactNode } from 'react';
import { type Recipient } from '@/lib/data';
// `invalidateNamespace` and `NS` were imported here but never used, and
// `invalidateNamespace` is not even exported by cached-data (it lives in
// ./cache), so the binding resolved to undefined.
import { getCachedRecipients } from '@/lib/cached-data';
import { useDebounce } from '@/hooks/use-debounce';

/**
 * Recipients revealed per "load more".
 *
 * Exported so a server-rendered page can slice its seed identically. Without
 * that, SSR emits the full list, the client renders one batch, and React
 * reports a hydration mismatch.
 */
export const BATCH_SIZE = 2;

interface RecipientContextType {
  recipients: Recipient[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  loadMore: () => void;
  scrollPosition: number;
  setScrollPosition: (position: number) => void;
  refreshRecipients: () => void;
  /** Seed the list with data the server already fetched. */
  hydrate: (seed: Recipient[]) => void;
  /** Fetch the list once, for any consumer without a server seed. */
  ensureLoaded: () => void;
}

const RecipientContext = createContext<RecipientContextType | undefined>(undefined);

export function RecipientProvider({ children }: { children: ReactNode }) {
  const [initialRecipients, setInitialRecipients] = useState<Recipient[]>([]);
  const [paginatedRecipients, setPaginatedRecipients] = useState<Recipient[]>([]);
  const [searchedRecipients, setSearchedRecipients] = useState<Recipient[]>([]);
  // Starts false: nothing is fetched until a consumer asks, so an unseeded
  // provider is idle rather than perpetually "loading".
  const [isLoading, setIsLoading] = useState(false);
  const hasLoadedRef = useRef(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [scrollPosition, setScrollPosition] = useState(0);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Function to fetch recipients, either initial set or based on search
  const fetchRecipients = useCallback(async (term?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedRecipients = await getCachedRecipients(
        term,
        // SWR callback: when background revalidation completes, update state
        (freshData) => {
          if (term) {
            setSearchedRecipients(freshData);
          } else {
            setInitialRecipients(freshData);
            setPaginatedRecipients(freshData.slice(0, BATCH_SIZE));
            setHasMore(freshData.length > BATCH_SIZE);
          }
        },
      );
      if (term) {
        setSearchedRecipients(fetchedRecipients);
      } else {
        setInitialRecipients(fetchedRecipients);
        const initialBatch = fetchedRecipients.slice(0, BATCH_SIZE);
        setPaginatedRecipients(initialBatch);
        setHasMore(fetchedRecipients.length > BATCH_SIZE);
      }
    } catch (err) {
      setError('Failed to fetch recipient data.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Expose a function to allow other components to trigger a refresh
  const refreshRecipients = useCallback(() => {
    fetchRecipients(debouncedSearchTerm);
  }, [fetchRecipients, debouncedSearchTerm]);


  /**
   * Hydrate from data the server already fetched.
   *
   * This provider used to fetch on mount, and it is mounted in the ROOT
   * layout — so every page view of the entire site paid for the browse query:
   * 50 Firestore reads to build a list most visitors never looked at. The
   * browse page now fetches server-side, behind its own ISR cache, and hands
   * the result down here. Nothing else triggers a read at all.
   */
  const hydrate = useCallback((seed: Recipient[]) => {
    setInitialRecipients(seed);
    setPaginatedRecipients(seed.slice(0, BATCH_SIZE));
    setHasMore(seed.length > BATCH_SIZE);
    setIsLoading(false);
    hasLoadedRef.current = true;
  }, []);

  /** Fetches once, for any consumer that needs the list without a seed. */
  const ensureLoaded = useCallback(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    fetchRecipients();
  }, [fetchRecipients]);

  // Handle search logic
  useEffect(() => {
    if (debouncedSearchTerm) {
      fetchRecipients(debouncedSearchTerm);
    } else {
      // Clear search results when search term is empty
      setSearchedRecipients([]);
    }
  }, [debouncedSearchTerm, fetchRecipients]);


  const loadMore = useCallback(() => {
    if (isLoading || isLoadingMore || !hasMore || debouncedSearchTerm) return;

    setIsLoadingMore(true);
    setTimeout(() => {
      const currentLength = paginatedRecipients.length;
      const nextBatch = initialRecipients.slice(currentLength, currentLength + BATCH_SIZE);

      if (nextBatch.length > 0) {
        setPaginatedRecipients(prev => [...prev, ...nextBatch]);
      }

      setHasMore(currentLength + nextBatch.length < initialRecipients.length);
      setIsLoadingMore(false);
    }, 500);

  }, [isLoading, isLoadingMore, hasMore, initialRecipients, paginatedRecipients, debouncedSearchTerm]);


  const displayedRecipients = useMemo(() => {
    if (debouncedSearchTerm) {
      return searchedRecipients;
    }
    return paginatedRecipients;
  }, [debouncedSearchTerm, searchedRecipients, paginatedRecipients]);

  const value = {
    recipients: displayedRecipients,
    isLoading,
    isLoadingMore,
    hasMore: debouncedSearchTerm ? false : hasMore,
    error,
    searchTerm,
    setSearchTerm,
    loadMore,
    scrollPosition,
    setScrollPosition,
    refreshRecipients,
    hydrate,
    ensureLoaded,
  };

  return (
    <RecipientContext.Provider value={value}>
      {children}
    </RecipientContext.Provider>
  );
}

export function useRecipientContext() {
  const context = useContext(RecipientContext);
  if (context === undefined) {
    throw new Error('useRecipientContext must be used within a RecipientProvider');
  }
  return context;
}
